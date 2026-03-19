import { createAuthEndpoint } from '@better-auth/core/api';
import { APIError } from '@better-auth/core/error';
import { setSessionCookie } from 'better-auth/cookies';
import { generateState, handleOAuthUserInfo, parseState } from 'better-auth/oauth2';
import * as z from 'zod';

export type CasProfileMapping = {
  stableIdPaths: string[];
  namePaths: string[];
  emailPaths: string[];
  imagePaths: string[];
};

export type CasRawProfile = Record<string, unknown>;

export type CasNormalizedProfile = {
  stableId: string;
  name: string;
  email: string;
  image: string | null;
};

export type MappingResolutionItem = {
  paths: string[];
  selectedPath: string | null;
  selectedValue: string | null;
};

export type CasMappingResolution = {
  stableId: MappingResolutionItem;
  name: MappingResolutionItem;
  email: MappingResolutionItem;
  image: MappingResolutionItem;
};

export type CreateCasPluginOptions = {
  casBaseUrl: string;
  validateUrl?: string;
  redirectUri?: string;
  callbackPath?: string;
  pluginId?: string;
  providerId?: string;
  profileMapping?: Partial<CasProfileMapping>;
  fallbackName?: string;
  fallbackEmailDomain?: string;
  onProfileResolved?: (
    ctx: any,
    payload: {
      providerId: string;
      accountId: string;
      rawProfile: CasRawProfile;
      normalizedProfile: CasNormalizedProfile;
      mappingResolution: CasMappingResolution;
      ticket: string;
    }
  ) => Promise<void> | void;
};

type ParsedCasValidationResult =
  | {
      ok: true;
      stableId: string;
      attributes: Record<string, unknown>;
    }
  | {
      ok: false;
      errorCode: string;
      errorMessage: string;
    };

const DEFAULT_CAS_CALLBACK_PATH = '/cas/callback';

const DEFAULT_CAS_PROFILE_MAPPING: CasProfileMapping = {
  stableIdPaths: ['id', 'attributes.accountId', 'attributes.userId', 'user'],
  namePaths: ['attributes.userName', 'attributes.name', 'name'],
  emailPaths: ['attributes.email', 'email'],
  imagePaths: ['attributes.avatar', 'avatar', 'image'],
};

const signInWithCasBodySchema = z.object({
  callbackURL: z.string().optional(),
  errorCallbackURL: z.string().optional(),
  newUserCallbackURL: z.string().optional(),
  disableRedirect: z.boolean().optional(),
  requestSignUp: z.boolean().optional(),
});

const casCallbackQuerySchema = z.object({
  ticket: z.string().optional(),
  state: z.string().optional(),
});

function normalizePathArray(input: unknown, fallback: readonly string[]) {
  if (!Array.isArray(input)) {
    return [...fallback];
  }

  const normalized = input
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);

  return normalized.length > 0 ? normalized : [...fallback];
}

function normalizeProfileMapping(input?: Partial<CasProfileMapping>): CasProfileMapping {
  return {
    stableIdPaths: normalizePathArray(
      input?.stableIdPaths,
      DEFAULT_CAS_PROFILE_MAPPING.stableIdPaths
    ),
    namePaths: normalizePathArray(input?.namePaths, DEFAULT_CAS_PROFILE_MAPPING.namePaths),
    emailPaths: normalizePathArray(
      input?.emailPaths,
      DEFAULT_CAS_PROFILE_MAPPING.emailPaths
    ),
    imagePaths: normalizePathArray(
      input?.imagePaths,
      DEFAULT_CAS_PROFILE_MAPPING.imagePaths
    ),
  };
}

function readPath(raw: CasRawProfile, path: string) {
  return path
    .split('.')
    .reduce<unknown>(
      (current, key) =>
        current && typeof current === 'object'
          ? (current as Record<string, unknown>)[key]
          : undefined,
      raw
    );
}

function pickFirstString(raw: CasRawProfile, paths: string[]) {
  for (const path of paths) {
    const value = readPath(raw, path);
    if (typeof value === 'string' && value.trim()) {
      return {
        selectedPath: path,
        selectedValue: value.trim(),
      };
    }
  }

  return {
    selectedPath: null,
    selectedValue: null,
  };
}

function normalizeCasProfile(
  raw: CasRawProfile,
  profileMapping: CasProfileMapping,
  fallbackName: string,
  fallbackEmailDomain: string
): {
  normalized: CasNormalizedProfile;
  mappingResolution: CasMappingResolution;
} {
  const stableIdMatch = pickFirstString(raw, profileMapping.stableIdPaths);
  const stableId = stableIdMatch.selectedValue || '';
  if (!stableId) {
    throw new Error('CAS profile has no stable id');
  }

  const nameMatch = pickFirstString(raw, profileMapping.namePaths);
  const emailMatch = pickFirstString(raw, profileMapping.emailPaths);
  const imageMatch = pickFirstString(raw, profileMapping.imagePaths);

  const name = nameMatch.selectedValue || fallbackName;
  const email = emailMatch.selectedValue || `${stableId}@${fallbackEmailDomain}`;
  const image = imageMatch.selectedValue || null;

  return {
    normalized: {
      stableId,
      name,
      email,
      image,
    },
    mappingResolution: {
      stableId: {
        paths: [...profileMapping.stableIdPaths],
        selectedPath: stableIdMatch.selectedPath,
        selectedValue: stableIdMatch.selectedValue,
      },
      name: {
        paths: [...profileMapping.namePaths],
        selectedPath: nameMatch.selectedPath,
        selectedValue: nameMatch.selectedValue,
      },
      email: {
        paths: [...profileMapping.emailPaths],
        selectedPath: emailMatch.selectedPath,
        selectedValue: emailMatch.selectedValue,
      },
      image: {
        paths: [...profileMapping.imagePaths],
        selectedPath: imageMatch.selectedPath,
        selectedValue: imageMatch.selectedValue,
      },
    },
  };
}

function decodeXmlEntities(input: string) {
  return input
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function parseCasAttributes(block: string) {
  const attributes: Record<string, unknown> = {};
  const matcher = /<cas:([A-Za-z0-9_-]+)>([\s\S]*?)<\/cas:\1>/g;

  for (const match of block.matchAll(matcher)) {
    const key = match[1];
    const value = decodeXmlEntities(match[2] || '');
    const current = attributes[key];

    if (current === undefined) {
      attributes[key] = value;
      continue;
    }

    if (Array.isArray(current)) {
      attributes[key] = [...current, value];
      continue;
    }

    attributes[key] = [current, value];
  }

  return attributes;
}

function parseCasValidationXml(xml: string): ParsedCasValidationResult {
  const failureMatch = xml.match(
    /<cas:authenticationFailure([^>]*)>([\s\S]*?)<\/cas:authenticationFailure>/i
  );
  if (failureMatch) {
    const codeMatch = failureMatch[1]?.match(/code=["']([^"']+)["']/i);
    return {
      ok: false,
      errorCode: codeMatch?.[1] || 'AUTHENTICATION_FAILURE',
      errorMessage: decodeXmlEntities(failureMatch[2] || 'CAS authentication failed'),
    };
  }

  const successMatch = xml.match(
    /<cas:authenticationSuccess[^>]*>([\s\S]*?)<\/cas:authenticationSuccess>/i
  );
  if (!successMatch) {
    return {
      ok: false,
      errorCode: 'INVALID_CAS_RESPONSE',
      errorMessage: 'Missing authenticationSuccess in CAS response',
    };
  }

  const successBlock = successMatch[1] || '';
  const userMatch = successBlock.match(/<cas:user>([\s\S]*?)<\/cas:user>/i);
  const stableId = decodeXmlEntities(userMatch?.[1] || '');
  if (!stableId) {
    return {
      ok: false,
      errorCode: 'MISSING_CAS_USER',
      errorMessage: 'CAS response does not include cas:user',
    };
  }

  const attributesBlockMatch = successBlock.match(
    /<cas:attributes>([\s\S]*?)<\/cas:attributes>/i
  );
  const attributes = attributesBlockMatch
    ? parseCasAttributes(attributesBlockMatch[1] || '')
    : {};

  return {
    ok: true,
    stableId,
    attributes,
  };
}

function buildErrorRedirectUrl(errorUrl: string, errorCode: string) {
  const url = new URL(errorUrl);
  url.searchParams.set('error', errorCode);
  return url.toString();
}

function buildServiceUrl(baseUrl: string, redirectUri: string, callbackPath: string, state: string) {
  const callbackUrl = redirectUri
    ? new URL(redirectUri)
    : new URL(callbackPath, baseUrl);

  if (state) {
    callbackUrl.searchParams.set('state', state);
  }

  return callbackUrl;
}

function buildRawProfile(stableId: string, attributes: Record<string, unknown>) {
  return {
    id: stableId,
    user: stableId,
    attributes,
  } satisfies CasRawProfile;
}

async function validateCasTicket(params: {
  validateUrl: string;
  serviceUrl: string;
  ticket: string;
}) {
  const endpoint = new URL(params.validateUrl);
  endpoint.searchParams.set('service', params.serviceUrl);
  endpoint.searchParams.set('ticket', params.ticket);

  const response = await fetch(endpoint.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`CAS validate request failed: ${response.status}`);
  }

  const xml = await response.text();
  return parseCasValidationXml(xml);
}

function normalizeCasBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/$/, '');
}

function deriveValidateUrl(casBaseUrl: string, configuredValidateUrl?: string) {
  const normalized = configuredValidateUrl?.trim();
  if (normalized) {
    return normalized;
  }

  return `${normalizeCasBaseUrl(casBaseUrl)}/serviceValidate`;
}

function toCasEndpoint(baseUrl: string, path: string) {
  return `${normalizeCasBaseUrl(baseUrl)}${path}`;
}

async function buildCasSignInResponse(ctx: any, params: {
  casBaseUrl: string;
  redirectUri: string;
  callbackPath: string;
}) {
  if (!params.casBaseUrl) {
    throw APIError.from('BAD_REQUEST', {
      message: 'CAS is not configured',
      code: 'CAS_NOT_CONFIGURED',
    });
  }

  const { state } = await generateState(ctx, undefined, undefined);
  const serviceUrl = buildServiceUrl(
    ctx.context.baseURL,
    params.redirectUri,
    params.callbackPath,
    state
  );
  const loginUrl = new URL(toCasEndpoint(params.casBaseUrl, '/login'));
  loginUrl.searchParams.set('service', serviceUrl.toString());

  return ctx.json({
    url: loginUrl.toString(),
    redirect: !ctx.body.disableRedirect,
  });
}

export function createStandardCasPlugin(options: CreateCasPluginOptions) {
  const pluginId = options.pluginId || 'cas-standard-auth';
  const providerId = options.providerId || 'cas';
  const callbackPath = options.callbackPath || DEFAULT_CAS_CALLBACK_PATH;
  const profileMapping = normalizeProfileMapping(options.profileMapping);
  const fallbackName = options.fallbackName || 'Unknown User';
  const fallbackEmailDomain = options.fallbackEmailDomain || 'noemail.local';
  const casBaseUrl = normalizeCasBaseUrl(options.casBaseUrl);
  const validateUrl = deriveValidateUrl(casBaseUrl, options.validateUrl);
  const redirectUri = options.redirectUri?.trim() || '';

  return {
    id: pluginId,
    endpoints: {
      signInWithCas: createAuthEndpoint(
        '/sign-in/cas',
        {
          method: 'POST',
          body: signInWithCasBodySchema,
        },
        async (ctx: any) =>
          buildCasSignInResponse(ctx, {
            casBaseUrl,
            redirectUri,
            callbackPath,
          })
      ),
      casCallback: createAuthEndpoint(
        callbackPath,
        {
          method: 'GET',
          query: casCallbackQuerySchema,
        },
        async (ctx: any) => {
          const defaultErrorUrl =
            ctx.context.options.onAPIError?.errorURL ||
            `${ctx.context.baseURL}/error`;

          if (!ctx.query.ticket) {
            throw ctx.redirect(
              buildErrorRedirectUrl(defaultErrorUrl, 'cas_ticket_missing')
            );
          }

          if (!casBaseUrl) {
            throw ctx.redirect(
              buildErrorRedirectUrl(defaultErrorUrl, 'cas_not_configured')
            );
          }

          if (!ctx.query) {
            ctx.query = {};
          }

          if (!ctx.query.state) {
            throw ctx.redirect(
              buildErrorRedirectUrl(defaultErrorUrl, 'state_mismatch')
            );
          }

          const stateData = await parseState(ctx);
          const serviceUrl = buildServiceUrl(
            ctx.context.baseURL,
            redirectUri,
            callbackPath,
            ctx.query.state || ''
          );

          const validationResult = await validateCasTicket({
            validateUrl,
            serviceUrl: serviceUrl.toString(),
            ticket: String(ctx.query.ticket),
          }).catch(() => ({
            ok: false as const,
            errorCode: 'cas_validate_failed',
            errorMessage: 'CAS validate request failed',
          }));

          if (!validationResult.ok) {
            throw ctx.redirect(
              buildErrorRedirectUrl(
                stateData.errorURL || defaultErrorUrl,
                validationResult.errorCode
              )
            );
          }

          const rawProfile = buildRawProfile(
            validationResult.stableId,
            validationResult.attributes
          );
          const { normalized, mappingResolution } = normalizeCasProfile(
            rawProfile,
            profileMapping,
            fallbackName,
            fallbackEmailDomain
          );

          if (options.onProfileResolved) {
            try {
              await options.onProfileResolved(ctx, {
                providerId,
                accountId: normalized.stableId,
                rawProfile,
                normalizedProfile: normalized,
                mappingResolution,
                ticket: String(ctx.query.ticket),
              });
            } catch (error) {
              console.error('CAS onProfileResolved hook failed:', error);
            }
          }

          const result = await handleOAuthUserInfo(ctx, {
            userInfo: {
              id: normalized.stableId,
              name: normalized.name,
              email: normalized.email.toLowerCase(),
              image: normalized.image,
              emailVerified: false,
            },
            account: {
              providerId,
              accountId: normalized.stableId,
            },
            callbackURL: stateData.callbackURL,
            disableSignUp: stateData.requestSignUp === false,
            overrideUserInfo: true,
          });

          if (result.error) {
            throw ctx.redirect(
              buildErrorRedirectUrl(
                stateData.errorURL || defaultErrorUrl,
                result.error.replace(/\s+/g, '_')
              )
            );
          }

          if (!result.data) {
            throw ctx.redirect(
              buildErrorRedirectUrl(
                stateData.errorURL || defaultErrorUrl,
                'cas_sign_in_failed'
              )
            );
          }

          await setSessionCookie(ctx, result.data);

          const callbackTarget = result.isRegister
            ? stateData.newUserURL || stateData.callbackURL
            : stateData.callbackURL;

          throw ctx.redirect(String(callbackTarget));
        }
      ),
    },
  };
}

export const __internal = {
  DEFAULT_CAS_CALLBACK_PATH,
  DEFAULT_CAS_PROFILE_MAPPING,
  normalizeProfileMapping,
  parseCasValidationXml,
  normalizeCasProfile,
  buildServiceUrl,
  deriveValidateUrl,
  buildRawProfile,
  decodeXmlEntities,
};
