import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type {
  GenerateRegistrationOptionsOpts,
  VerifyRegistrationResponseOpts,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { isoUint8Array } from '@simplewebauthn/server/helpers';
import { rpName, getRpID, getRpOrigin } from './config';

type CreateRegistrationOptionsParams = {
  userId: string;
  email: string;
  name: string;
  existingCredentialIds: string[];
};

export async function createRegistrationOptions(
  params: CreateRegistrationOptionsParams,
) {
  const opts: GenerateRegistrationOptionsOpts = {
    rpName,
    rpID: getRpID(),
    userID: isoUint8Array.fromUTF8String(params.userId),
    userName: params.email,
    userDisplayName: params.name,
    excludeCredentials: params.existingCredentialIds.map((id) => ({
      id,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  };

  return generateRegistrationOptions(opts);
}

type VerifyRegistrationParams = {
  response: RegistrationResponseJSON;
  expectedChallenge: string;
};

export async function verifyRegistration(params: VerifyRegistrationParams) {
  const rpID = getRpID();
  const opts: VerifyRegistrationResponseOpts = {
    response: params.response,
    expectedChallenge: params.expectedChallenge,
    expectedOrigin: getRpOrigin(),
    expectedRPID: rpID,
  };

  return verifyRegistrationResponse(opts);
}
