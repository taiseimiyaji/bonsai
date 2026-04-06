import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma/prisma";
import { verifyAndConsumeAuthToken } from "./server/passkey/auth-token";
import { AUTH_TOKEN_COOKIE_NAME } from "./app/lib/webauthn/config";
import type { Adapter } from "@auth/core/adapters";
import type { Provider } from "@auth/core/providers";
import type { JWT } from "next-auth/jwt";
import type { Session, User, Account } from "next-auth";

export const { handlers, auth, signIn } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30日間
    updateAge: 24 * 60 * 60, // 24時間ごとに更新
  },
  // Auth.js v5 では secret は自動的に AUTH_SECRET から読み込まれる
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      id: "passkey",
      name: "PassKey",
      credentials: {},
      async authorize(_credentials, request) {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) return null;

        const cookies = Object.fromEntries(
          cookieHeader.split(/;\s*/).map((c) => {
            const [key, ...rest] = c.split("=");
            return [key, rest.join("=")];
          }),
        );
        const authToken = cookies[AUTH_TOKEN_COOKIE_NAME];
        if (!authToken) return null;

        const userId = verifyAndConsumeAuthToken(decodeURIComponent(authToken));
        if (!userId) return null;
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });
        if (!user) {
          return null;
        }
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ] as Provider[],
  pages: {
    signIn: '/auth/signin', 
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ 
      token, 
      user, 
      account 
    }: {
      token: JWT;
      user?: User;
      account?: Account | null;
    }) {
      if (user) {
        token.userId = user.id; 
        // adapter経由だとuserにカスタムフィールド(role)が含まれない可能性があるためDBから取得
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        token.role = dbUser?.role;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.userId) {
        session.userId = token.userId as string;
        if (session.user) {
          session.user.id = token.userId as string;
          session.user.userId = token.userId as string;
        } else {
          session.user = { id: token.userId as string } as Session['user'];
          session.user.userId = token.userId as string;
        }
      }
      if (token.role && session.user) {
        session.user.role = token.role as string;
      }
      return session;
    },
    async signIn({ 
      user, 
      account 
    }: {
      user: User;
      account: Account | null;
    }) {
      if (account?.provider === "passkey") {
        return true;
      }
      if (account?.provider === "google") {
        const googleId = account.providerAccountId;
        if (!googleId || !user.email || !user.name) {
          console.error('Missing required user data from Google:', { googleId, email: user.email, name: user.name });
          return false;
        }

        try {
          let dbUser = await prisma.user.findUnique({
            where: { googleId: googleId },
          });

          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                googleId,
                email: user.email,
                name: user.name,
                image: user.image,
              },
            });
          } else if (user.image && dbUser.image !== user.image) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { image: user.image },
            });
          }
          user.id = dbUser.id;
          return true;
        } catch (error) {
          console.error('SignIn Callback Error:', error);
          return false;
        }
      }
      return false;
    },
  },
  debug: process.env.NODE_ENV === 'development',
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30日間
  },
});
