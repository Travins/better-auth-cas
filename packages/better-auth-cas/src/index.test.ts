import { describe, expect, it } from 'vitest';
import { __internal } from './index';

describe('better-auth-cas internal utilities', () => {
  it('parses CAS success XML with attributes', () => {
    const result = __internal.parseCasValidationXml(`<?xml version="1.0"?>
<cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas">
  <cas:authenticationSuccess>
    <cas:user>u12345</cas:user>
    <cas:attributes>
      <cas:email>u12345@example.com</cas:email>
      <cas:deptCode>D01</cas:deptCode>
    </cas:attributes>
  </cas:authenticationSuccess>
</cas:serviceResponse>`);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stableId).toBe('u12345');
      expect(result.attributes.email).toBe('u12345@example.com');
      expect(result.attributes.deptCode).toBe('D01');
    }
  });

  it('parses CAS failure XML', () => {
    const result = __internal.parseCasValidationXml(`<?xml version="1.0"?>
<cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas">
  <cas:authenticationFailure code="INVALID_TICKET">
    Ticket is invalid
  </cas:authenticationFailure>
</cas:serviceResponse>`);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorCode).toBe('INVALID_TICKET');
    }
  });

  it('normalizes profile with fallback values', () => {
    const mapping = __internal.normalizeProfileMapping({
      stableIdPaths: ['id'],
      namePaths: ['attributes.name'],
      emailPaths: ['attributes.email'],
      imagePaths: ['attributes.avatar'],
    });
    const raw = {
      id: 'abc001',
      attributes: {
        name: 'Alice',
      },
    };

    const { normalized } = __internal.normalizeCasProfile(
      raw,
      mapping,
      'Unknown',
      'noemail.local'
    );

    expect(normalized.stableId).toBe('abc001');
    expect(normalized.name).toBe('Alice');
    expect(normalized.email).toBe('abc001@noemail.local');
    expect(normalized.image).toBeNull();
  });

  it('builds service URL with callback path and state', () => {
    const url = __internal.buildServiceUrl(
      'http://localhost:3000',
      '',
      '/api/auth/cas/callback',
      'state123'
    );
    expect(url.toString()).toContain('/api/auth/cas/callback');
    expect(url.searchParams.get('state')).toBe('state123');
  });

  it('derives validate URL from CAS base URL', () => {
    expect(
      __internal.deriveValidateUrl('https://cas.example.edu/cas', undefined)
    ).toBe('https://cas.example.edu/cas/serviceValidate');
  });
});
