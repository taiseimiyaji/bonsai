import { z } from 'zod';
import { router, protectedProcedure } from '../init';
import {
  findPasskeysByUserId,
  deletePasskey,
  renamePasskey,
} from '@/server/passkey/actions';

export const passkeyRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    if (!userId) {
      throw new Error('User ID is required');
    }
    const passkeys = await findPasskeysByUserId(userId);
    return passkeys.map((p) => ({
      id: p.id,
      credentialId: p.credentialId,
      name: p.name,
      credentialDeviceType: p.credentialDeviceType,
      credentialBackedUp: p.credentialBackedUp,
      createdAt: p.createdAt,
    }));
  }),

  delete: protectedProcedure
    .input(z.object({ passkeyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      if (!userId) {
        throw new Error('User ID is required');
      }
      await deletePasskey(input.passkeyId, userId);
      return { success: true };
    }),

  rename: protectedProcedure
    .input(
      z.object({
        passkeyId: z.string(),
        name: z.string().min(1, '名前は必須です').max(100, '名前は100文字以内にしてください'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      if (!userId) {
        throw new Error('User ID is required');
      }
      await renamePasskey(input.passkeyId, userId, input.name);
      return { success: true };
    }),
});
