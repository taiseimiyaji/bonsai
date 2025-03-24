import GoogleProvider from "next-auth/providers/google";

import type { NextAuthOptions } from "next-auth";
import {prisma} from "@/prisma/prisma";

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
				// userオブジェクトからIDを取得
				token.userId = user.id;
				token.role = (user as any).role;
			}
			if (account) {
				token.accessToken = account.access_token;
			}
			return token;
		},
		session: ({ session, token }) => {
			return {
				...session,
				userId: token.userId,
				user: {
					...session.user,
					userId: token.userId,
					role: token.role,
				},
			};
		},
		signIn: async ({ user, account, profile }) => {
			try {
				if (account?.provider === "google") {
					const googleId = profile?.sub;
					let dbUser = await prisma.user.findUnique({
						where: { googleId: googleId },
					});
					if (!dbUser) {
						if (!user.email || !user.name || !googleId) {
							return "/auth/error";
						}
						dbUser = await prisma.user.create({
							data: {
								googleId,
								email: user.email,
								name: user.name,
								image: user.image,
							},
						});
					}
					if(user.image && dbUser.image !== user.image) {
						await prisma.user.update({
							where: { id: dbUser.id },
							data: { image: user.image },
						});
					}
					// userオブジェクトにデータベースのユーザーIDを設定
					user.id = dbUser.id;
					return true;
				}
				return false;
			} catch (error) {
				console.error("Error in signIn callback:", error);
				return false;
			}
		},
	},
};
