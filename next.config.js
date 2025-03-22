/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		domains: [
			"lh3.googleusercontent.com", 
			"res.cloudinary.com",
			"storage.googleapis.com"
		],
	},
	// すべてのページをSSR前提にする設定
	output: 'standalone',
	// 静的最適化を無効化
	experimental: {
		// 静的最適化を無効化
		isrFlushToDisk: false,
	},
	// 環境変数に基づいて設定を変更
	env: {
		// ビルド時はダミーのデータベース接続を使用
		DATABASE_URL: process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build' 
			? 'postgresql://dummy:dummy@localhost:5432/dummy?schema=dummy' 
			: process.env.DATABASE_URL,
		DIRECT_URL: process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build'
			? 'postgresql://dummy:dummy@localhost:5432/dummy?schema=dummy'
			: process.env.DIRECT_URL,
	},
};

module.exports = nextConfig;
