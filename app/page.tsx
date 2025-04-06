'use client';
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { TermsModal } from "./_components/TermsModal";
import { InfoPageContent } from "./rss/info/_components/InfoPageContent";

export default function TopPage() {
	const router = useRouter();
	const { data: session, status } = useSession();
	const [termsAgreed, setTermsAgreed] = useState(false);
	const [showTermsModal, setShowTermsModal] = useState(false);
	const [showPrivacyModal, setShowPrivacyModal] = useState(false);
	const [termsContent, setTermsContent] = useState('');
	const [privacyContent, setPrivacyContent] = useState('');

	useEffect(() => {
		if (status === "authenticated") {
			router.push("/rss/info");
		}
		// 利用規約とプライバシーポリシーの内容を取得
		fetch('/term.md')
			.then(res => res.text())
			.then(text => setTermsContent(text));
		fetch('/privacy-policy.md')
			.then(res => res.text())
			.then(text => setPrivacyContent(text));
	}, [status, router]);

	const handleLogin = async (event: React.MouseEvent) => {
		event.preventDefault();
		if (!termsAgreed) {
			alert('利用規約とプライバシーポリシーに同意してください。');
			return;
		}
		const result = await signIn("google", { callbackUrl: "/rss/info" });
	};

	return (
		<div className="min-h-screen bg-gray-900">
			{/* ヒーローセクション */}
			<section className="bg-gradient-to-r from-blue-900 to-indigo-900 py-20">
				<div className="max-w-6xl mx-auto px-6">
					<h1 className="text-5xl font-bold mb-6 text-white">bonsai</h1>
					<p className="text-xl mb-8 text-gray-300">情報を整理し、知識を育てる。あなたのデジタルガーデンへようこそ。</p>
					{!session && (
						<div className="space-y-4">
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="terms"
									checked={termsAgreed}
									onChange={(e) => setTermsAgreed(e.target.checked)}
									className="w-4 h-4"
								/>
								<label htmlFor="terms" className="text-sm text-gray-300">
									<button
										onClick={() => setShowTermsModal(true)}
										className="underline hover:text-blue-300"
									>
										利用規約
									</button>
									と
									<button
										onClick={() => setShowPrivacyModal(true)}
										className="underline hover:text-blue-300"
									>
										プライバシーポリシー
									</button>
									に同意する
								</label>
							</div>
							<button
								onClick={handleLogin}
								className="flex items-center bg-white text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
							>
								<svg className="w-6 h-6 mr-3" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
									<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
									<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
									<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
									<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
									<path fill="none" d="M0 0h48v48H0z"/>
								</svg>
								Googleでログイン
							</button>
						</div>
					)}
				</div>
			</section>

			{/* 機能紹介セクション */}
			<section className="py-20 bg-gray-800">
				<div className="max-w-6xl mx-auto px-6">
					<h2 className="text-3xl font-bold mb-12 text-center text-white">主な機能</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						<div className="bg-gray-900 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-700">
							<h3 className="text-xl font-semibold mb-4 text-white">Todo List</h3>
							<p className="text-gray-300">タスクを効率的に管理し、生産性を向上させます。シンプルで使いやすいインターフェースで、やるべきことを整理できます。</p>
						</div>
						<div className="bg-gray-900 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-700">
							<h3 className="text-xl font-semibold mb-4 text-white">Scrap Book</h3>
							<p className="text-gray-300">重要な情報をスクラップブックに保存。アイデアやインスピレーションを逃さず記録し、必要な時にすぐに参照できます。</p>
						</div>
						<div className="bg-gray-900 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-700">
							<h3 className="text-xl font-semibold mb-4 text-white">RSSリーダー</h3>
							<p className="text-gray-300">お気に入りのウェブサイトの更新を一元管理。最新の情報をタイムリーにキャッチし、効率的に情報収集できます。</p>
						</div>
						<div className="bg-gray-900 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-700">
							<h3 className="text-xl font-semibold mb-4 text-white">情報ダッシュボード</h3>
							<p className="text-gray-300">収集した記事を一覧で確認できる情報ハブ。重要な情報を見逃すことなく、効率的に情報を整理できます。</p>
						</div>
					</div>
				</div>
			</section>

			{/* トレンド記事セクション */}
			<section className="py-20 bg-gray-900">
				<div className="max-w-6xl mx-auto px-6">
					<h2 className="text-3xl font-bold mb-12 text-center text-white">トレンド記事</h2>
					<div className="bg-gray-800 rounded-lg shadow-lg p-6">
						<InfoPageContent isTopPage={true} />
					</div>
				</div>
			</section>

			{/* モーダル */}
			<TermsModal
				isOpen={showTermsModal}
				onClose={() => setShowTermsModal(false)}
				content={termsContent}
				title="利用規約"
			/>
			<TermsModal
				isOpen={showPrivacyModal}
				onClose={() => setShowPrivacyModal(false)}
				content={privacyContent}
				title="プライバシーポリシー"
			/>
		</div>
	);
}
