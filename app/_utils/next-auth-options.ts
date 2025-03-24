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
	pages: {
		error: '/auth/error',
		signIn: '/auth/signin',
	},
	callbacks: {
		jwt: async ({ token, user, account, profile }) => {
			console.log('JWT Callback - Input:', { token, user, account, profile });
			if (user) {
				token.userId = user.id;
				token.role = (user as any).role;
			}
			if (account) {
				token.accessToken = account.access_token;
			}
			console.log('JWT Callback - Output:', token);
			return token;
		},
		session: ({ session, token }) => {
			console.log('Session Callback - Input:', { session, token });
			const result = {
				...session,
				userId: token.userId,
				user: {
					...session.user,
					userId: token.userId,
					role: token.role,
				},
			};
			console.log('Session Callback - Output:', result);
			return result;
		},
		signIn: async ({ user, account, profile }) => {
			console.log('SignIn Callback - Start:', { user, account, profile });
			try {
				if (account?.provider === "google") {
					const googleId = profile?.sub;
					console.log('Looking up user with googleId:', googleId);
					
					let dbUser = await prisma.user.findUnique({
						where: { googleId: googleId },
					});
					console.log('Existing user:', dbUser);

					if (!dbUser) {
						if (!user.email || !user.name || !googleId) {
							console.error('Missing required user data:', { email: user.email, name: user.name, googleId });
							return "/auth/error";
						}
						console.log('Creating new user:', { email: user.email, name: user.name, googleId });
						dbUser = await prisma.user.create({
							data: {
								googleId,
								email: user.email,
								name: user.name,
								image: user.image,
							},
						});
						console.log('New user created:', dbUser);
					}

					if(user.image && dbUser.image !== user.image) {
						console.log('Updating user image:', { oldImage: dbUser.image, newImage: user.image });
						await prisma.user.update({
							where: { id: dbUser.id },
							data: { image: user.image },
						});
					}

					user.id = dbUser.id;
					console.log('SignIn Callback - Success:', { userId: user.id });
					return true;
				}
				console.log('SignIn Callback - Unsupported provider:', account?.provider);
				return false;
			} catch (error) {
				console.error('SignIn Callback - Error:', error);
				return false;
			}
		},
	},
};
