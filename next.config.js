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
		// node:プロトコルをサポート
		serverComponentsExternalPackages: ['pg', 'pg-native', 'undici', 'open-graph-scraper'],
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
	// node:プロトコルを処理するためのwebpack設定
	webpack: (config, { isServer }) => {
		// クライアントサイドのビルドの場合のみポリフィルを適用
		if (!isServer) {
			// node:プロトコルをサポートするためのフォールバック設定
			config.resolve.fallback = {
				...config.resolve.fallback,
				// Node.js組み込みモジュールのポリフィル
				fs: false,
				path: false,
				os: false,
				crypto: false,
				stream: false,
				buffer: false,
				util: false,
				assert: false,
				process: false,
				console: false,
			};
		}

		// node:プロトコルを処理するための設定
		config.resolve.alias = {
			...config.resolve.alias,
			'node:buffer': 'buffer',
			'node:crypto': 'crypto-browserify',
			'node:console': 'console-browserify',
			'node:stream': 'stream-browserify',
			'node:util': 'util',
			'node:assert': 'assert',
			'node:process': 'process/browser',
		};

		return config;
	},
};

module.exports = nextConfig;
