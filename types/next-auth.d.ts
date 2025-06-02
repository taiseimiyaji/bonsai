import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
	interface Session {
		userId?: string;
		user: {
			id: string;
			name?: string | null;
			email?: string | null;
			image?: string | null;
			userId?: string;
			role?: string;
		};
	}

	interface User {
		id: string;
		role?: string;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		userId?: string;
		role?: string;
		accessToken?: string;
	}
}
