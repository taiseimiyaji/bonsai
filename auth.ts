import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma/prisma";
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
      allowDangerousEmailAccountLinking: true, // 同じメールアドレスを持つアカウントの自動リンクを許可
    }),
  ] as Provider[],
  pages: {
    signIn: '/auth/signin', 
    error: '/auth/error',
  },
  callbacks: {
    // JWTにユーザーIDとロールを追加
    async jwt({ 
      token, 
      user, 
      account 
    }: {
      token: JWT;
      user?: User;
      account?: Account | null;
    }) {
      if (user) { // サインイン時にユーザー情報が存在する場合
        token.userId = user.id; 
        // adapter経由だとuserにカスタムフィールド(role)が含まれない可能性があるためDBから取得
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        token.role = dbUser?.role; // ユーザーのロールを追加
      }
      if (account) { // Googleなどのプロバイダー情報がある場合
        token.accessToken = account.access_token; // アクセストークンを追加
      }
      return token;
    },
    // セッションにJWTの情報を反映
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.userId) {
        // 既存のセッション情報にユーザーIDを統一的に付与
        session.userId = token.userId as string;
        if (session.user) {
          session.user.id = token.userId as string;
          (session.user as any).userId = token.userId as string;
        } else {
          session.user = { id: token.userId as string } as Session['user'];
          (session.user as any).userId = token.userId as string;
        }
        // session.userId を参照しているコードが存在するため、保持しておく
      }
      if (token.role && session.user) {
        (session.user as any).role = token.role; // ロールをセッションに追加 (型の拡張が必要な場合)
      }
      return session;
    },
    // サインイン処理: ユーザーが存在しない場合は作成、アイコン更新
    async signIn({ 
      user, 
      account 
    }: {
      user: User;
      account: Account | null;
    }) {
      if (account?.provider === "google") {
        const googleId = account.providerAccountId;
        if (!googleId || !user.email || !user.name) {
          console.error('Missing required user data from Google:', { googleId, email: user.email, name: user.name });
          return false; // or redirect('/auth/error?error=MissingUserData');
        }

        try {
          let dbUser = await prisma.user.findUnique({
            where: { googleId: googleId },
          });

          if (!dbUser) {
            // ユーザーが存在しない場合、作成
            dbUser = await prisma.user.create({
              data: {
                googleId,
                email: user.email,
                name: user.name,
                image: user.image,
                // role: 'USER', // デフォルトロールを設定する場合
              },
            });
          } else if (user.image && dbUser.image !== user.image) {
            // ユーザーが存在し、画像が更新されている場合
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { image: user.image },
            });
          }
          // userオブジェクトにデータベースのIDをセット (adapterがやってくれるはずだが念のため)
          user.id = dbUser.id; 
          return true; // サインイン許可
        } catch (error) {
          console.error('SignIn Callback Error:', error);
          return false; // or redirect('/auth/error?error=DatabaseError');
        }
      }
      // Google以外のプロバイダーはここではじく場合
      return false; 
    },
  },
  // デバッグを有効にする (開発中のみ)
  debug: process.env.NODE_ENV === 'development',
  // JWTの設定
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30日間
  },
});
