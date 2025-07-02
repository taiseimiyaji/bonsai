// app/layout.tsx
'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { trpc } from './trpc-client';
import { httpBatchLink } from '@trpc/client';

export default function RootLayout({ children }: { children: React.ReactNode }) {
	const [queryClient] = React.useState(() => new QueryClient({
		defaultOptions: {
			queries: {
				// 楽観的更新を維持するため、自動refetchを無効化
				refetchOnWindowFocus: false,
				refetchOnMount: false,
				refetchOnReconnect: false,
				// staleTimeを長めに設定（5分）
				staleTime: 5 * 60 * 1000,
				onError: (error: any) => {
					// 認証エラーの場合はサインインページにリダイレクト
					if (error?.data?.code === 'UNAUTHORIZED') {
						// 既にサインインページにいる場合はリダイレクトしない
						if (!window.location.pathname.includes('/auth/signin')) {
							window.location.href = '/auth/signin';
						}
					}
				},
			},
			mutations: {
				onError: (error: any) => {
					// 認証エラーの場合はサインインページにリダイレクト
					if (error?.data?.code === 'UNAUTHORIZED') {
						// 既にサインインページにいる場合はリダイレクトしない
						if (!window.location.pathname.includes('/auth/signin')) {
							window.location.href = '/auth/signin';
						}
					}
				},
			},
		},
	}));
	const [trpcClient] = React.useState(() =>
		trpc.createClient({
			links: [
				httpBatchLink({
					url: '/api/trpc',
					// 重要: クッキーを含めて認証情報を送信
					fetch(url, options) {
						return fetch(url, {
							...options,
							credentials: 'include',
						});
					},
				}),
			],
		})
	);

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<SessionProvider refetchInterval={30 * 60} refetchOnWindowFocus={false}>
				<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
			</SessionProvider>
		</trpc.Provider>
	);
}
