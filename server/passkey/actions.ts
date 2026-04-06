import { prisma } from '@/prisma/prisma';

type CreatePasskeyData = {
  userId: string;
  credentialId: string;
  credentialPublicKey: Buffer;
  counter: bigint;
  transports: string | null;
  credentialDeviceType: string;
  credentialBackedUp: boolean;
  name: string | null;
};

export async function createPasskey(data: CreatePasskeyData) {
  return prisma.passkey.create({
    data,
  });
}

export async function findPasskeysByUserId(userId: string) {
  return prisma.passkey.findMany({
    where: { userId },
  });
}

export async function findPasskeyByCredentialId(credentialId: string) {
  return prisma.passkey.findUnique({
    where: { credentialId },
  });
}

export async function updatePasskeyCounter(
  credentialId: string,
  counter: bigint,
) {
  return prisma.passkey.update({
    where: { credentialId },
    data: { counter },
  });
}

async function hasAlternativeAuth(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (user?.googleId) return true;

  const oauthAccount = await prisma.account.findFirst({
    where: { userId },
  });

  return oauthAccount !== null;
}

export async function deletePasskey(passkeyId: string, userId: string) {
  const passkey = await prisma.passkey.findFirst({
    where: { id: passkeyId, userId },
  });

  if (!passkey) {
    throw new Error('PassKeyが見つからないか、削除権限がありません');
  }

  const passkeyCount = await prisma.passkey.count({
    where: { userId },
  });

  if (passkeyCount === 1) {
    const hasAlt = await hasAlternativeAuth(userId);
    if (!hasAlt) {
      throw new Error(
        '最後のPassKeyです。代替の認証手段がないため削除できません',
      );
    }
  }

  return prisma.passkey.delete({
    where: { id: passkeyId },
  });
}

export async function renamePasskey(
  passkeyId: string,
  userId: string,
  name: string,
) {
  const passkey = await prisma.passkey.findFirst({
    where: { id: passkeyId, userId },
  });

  if (!passkey) {
    throw new Error('PassKeyが見つからないか、変更権限がありません');
  }

  return prisma.passkey.update({
    where: { id: passkeyId },
    data: { name },
  });
}
