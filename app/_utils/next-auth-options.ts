import GoogleProvider from "next-auth/providers/google";

import type { NextAuthOptions } from "next-auth";
import {prisma} from "@/prisma/prisma";

// App Router環境で使用するための関数として定義
export const getNextAuthOptions = (): NextAuthOptions => ({
	debug: true,
	session: { strategy: "jwt" },
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		}),
	],
	pages: {
		error: '/auth/error',
		signIn: '/auth/signin',
	},
	callbacks: {
		jwt: async ({ token, user, account, profile }) => {
			if (user) {
				token.userId = user.id;
				token.role = (user as any).role;
			}
			if (account) {
				token.accessToken = account.access_token;
			}
			return token;
		},
		session: ({ session, token }) => {
			const result = {
				...session,
				userId: token.userId,
				user: {
					...session.user,
					userId: token.userId,
					role: token.role,
				},
			};
			return result;
		},
		signIn: async ({ user, account, profile }) => {
			try {
				if (account?.provider === "google") {
					const googleId = account.providerAccountId;
					
					let dbUser = await prisma.user.findUnique({
						where: { googleId: googleId },
					});

					if (!dbUser) {
						if (!user.email || !user.name || !googleId) {
							console.error('Missing required user data:', { email: user.email, name: user.name, googleId });
							return "/auth/error";
						}
						try {
							dbUser = await prisma.user.create({
								data: {
									googleId,
									email: user.email,
									name: user.name,
									image: user.image,
								},
							});
						} catch (createError) {
							console.error('Error creating user:', createError);
							return "/auth/error";
						}
					}

					if(user.image && dbUser.image !== user.image) {
						await prisma.user.update({
							where: { id: dbUser.id },
							data: { image: user.image },
						});
					}

					user.id = dbUser.id;
					return true;
				}
				return false;
			} catch (error) {
				console.error('SignIn Callback - Error:', error);
				return "/auth/error";
			}
		},
	},
});

// 後方互換性のために残しておく
export const nextAuthOptions = getNextAuthOptions();
