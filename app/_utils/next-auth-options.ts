import GoogleProvider from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";
import type { Account, Profile } from "next-auth";
import { prisma } from "@/prisma/prisma";

// NextAuth.js v5用の設定
export const nextAuthConfig: NextAuthConfig = {
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
		jwt: async ({ 
			token, 
			user, 
			account 
		}: { 
			token: JWT; 
			user?: User; 
			account?: Account | null; 
		}) => {
			if (user) {
				token.userId = user.id;
				token.role = (user as any).role;
			}
			if (account) {
				token.accessToken = account.access_token;
			}
			return token;
		},
		session: ({ session, token }: { session: Session; token: JWT }) => {
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
		signIn: async ({ 
			user, 
			account 
		}: { 
			user: User; 
			account: Account | null; 
			profile?: Profile; 
		}) => {
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
};

// 後方互換性のためのエクスポート
export const getNextAuthOptions = () => nextAuthConfig;
export const nextAuthOptions = nextAuthConfig;
