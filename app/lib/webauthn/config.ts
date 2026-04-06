export const rpName = 'bonsai';

export const rpID = process.env.WEBAUTHN_RP_ID!;

export const rpOrigin = process.env.WEBAUTHN_ORIGIN!;

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
