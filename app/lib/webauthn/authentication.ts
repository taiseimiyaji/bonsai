import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  GenerateAuthenticationOptionsOpts,
  VerifyAuthenticationResponseOpts,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { rpID, rpOrigin } from './config';

export async function createAuthenticationOptions(
  credentialIds: string[],
) {
  const opts: GenerateAuthenticationOptionsOpts = {
    rpID,
    allowCredentials: credentialIds.map((id) => ({
      id,
    })),
  };

  return generateAuthenticationOptions(opts);
}

type PasskeyForVerification = {
  credentialId: string;
  credentialPublicKey: Buffer;
  counter: bigint;
};

type VerifyAuthenticationParams = {
  response: AuthenticationResponseJSON;
  expectedChallenge: string;
  passkey: PasskeyForVerification;
};

export async function verifyAuthentication(
  params: VerifyAuthenticationParams,
) {
  const opts: VerifyAuthenticationResponseOpts = {
    response: params.response,
    expectedChallenge: params.expectedChallenge,
    expectedOrigin: rpOrigin,
    expectedRPID: rpID,
    credential: {
      id: params.passkey.credentialId,
      publicKey: params.passkey.credentialPublicKey,
      counter: Number(params.passkey.counter),
    },
  };

  return verifyAuthenticationResponse(opts);
}
