export const rpName = 'bonsai';

function getAuthUrl(): URL {
  const authUrl = process.env.AUTH_URL;
  if (!authUrl) {
    throw new Error(
      'AUTH_URL environment variable is required when WEBAUTHN_RP_ID / WEBAUTHN_ORIGIN are not set',
    );
  }

  try {
    return new URL(authUrl);
  } catch {
    throw new Error('AUTH_URL must be a valid absolute URL');
  }
}

export const rpID = process.env.WEBAUTHN_RP_ID ?? getAuthUrl().hostname;

export const rpOrigin = process.env.WEBAUTHN_ORIGIN ?? getAuthUrl().origin;

export const CHALLENGE_COOKIE_NAME = '__webauthn_challenge';

export const USER_COOKIE_NAME = '__webauthn_user';

export const AUTH_TOKEN_COOKIE_NAME = '__passkey_auth_token';

export const challengeCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 5 * 60,
  path: '/',
};

export const authTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 5 * 60,
  path: '/',
};
