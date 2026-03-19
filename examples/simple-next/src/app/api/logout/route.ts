import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';

const DEFAULT_CAS_BASE_URL = 'https://cas.example.com/cas';

function buildCasLogoutUrl(origin: string) {
  const rawLogoutUrl =
    process.env.CAS_LOGOUT_URL ||
    `${process.env.CAS_BASE_URL || DEFAULT_CAS_BASE_URL}/logout`;
  const logoutUrl = new URL(rawLogoutUrl);
  const service = process.env.CAS_LOGOUT_SERVICE_URL || `${origin}/`;
  logoutUrl.searchParams.set('service', service);
  return logoutUrl.toString();
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const response = NextResponse.redirect(buildCasLogoutUrl(origin), 302);

  const signOutResponse = await (auth.api as any).signOut({
    headers: request.headers,
    body: {},
    asResponse: true,
  });

  if (signOutResponse instanceof Response) {
    const headersWithGetSetCookie = signOutResponse.headers as Headers & {
      getSetCookie?: () => string[];
    };
    const setCookies = headersWithGetSetCookie.getSetCookie?.() || [];

    if (setCookies.length > 0) {
      for (const cookieValue of setCookies) {
        response.headers.append('set-cookie', cookieValue);
      }
    } else {
      const singleSetCookie = signOutResponse.headers.get('set-cookie');
      if (singleSetCookie) {
        response.headers.set('set-cookie', singleSetCookie);
      }
    }
  }

  return response;
}
