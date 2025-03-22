/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		domains: [
			"lh3.googleusercontent.com", 
			"res.cloudinary.com",
			"storage.googleapis.com"
		],
	},
	// ビルド時にデータベースアクセスを回避するための設定
	experimental: {
		// ビルド時にはすべてのルートを静的に生成しない
		isrMemoryCacheSize: 0,
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
	// 動的なルートの設定
	// ビルド時にはすべてのルートを静的に生成せず、ランタイム時に生成する
	output: 'standalone',
};

module.exports = nextConfig;
