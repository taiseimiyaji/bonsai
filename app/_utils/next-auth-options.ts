import GoogleProvider from "next-auth/providers/google";

import type { NextAuthOptions } from "next-auth";
import { PrismaClient } from "@prisma/client";

export const nextAuthOptions: NextAuthOptions = {
    debug: true,
    session: { strategy: "jwt" },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        jwt: async ({ token, user, account, profile }) => {
            if (user) {
                token.user = user;
                const u = user as any;
                token.role = u.role;
            }
            if (account) {
                token.accessToken = account.access_token;
            }
            return token;
        },
        session: ({ session, token }) => {
            return {
                ...session,
                userId: token.id,
                user: {
                    ...session.user,
                    role: token.role,
                },
            };
        },
        signIn: async ({ user, account, profile }) => {
            if (account?.provider === "google") {
                const prisma = new PrismaClient();
                const googleId = profile?.sub;
                let dbUser = await prisma.user.findUnique({
                    where: { googleId: googleId },
                });
                // ユーザーが存在しない場合は新規ユーザーを作成する。
                // TODO: 将来的に切り出してもいいかも
                if (!dbUser) {
                    // ユーザー情報が不足している場合はエラーページを返す。
                    if (!user.email || !user.name || !googleId) {
                        return "/auth/error";
                    }
                    dbUser = await prisma.user.create({
                        data: {
                            googleId,
                            email: user.email,
                            name: user.name,
                        },
                    });
                    user.id = dbUser.id;
                }
            }
            return true;
        }
    },
};
