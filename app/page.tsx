'use client';
import {useRouter} from "next/navigation";

export default function TopPage() {
	const router = useRouter();
	return (
		<div className="max-w-4xl mx-auto p-6">
			<h1 className="text-3xl font-bold mb-6">Top Page</h1>
			<h2 className="text-2xl font-semibold mb-4">機能一覧</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
					<button
						className={"block bg-white dark:bg-gray-900 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-1 hover:scale-105 p-6 relative"}
						onClick={() => {
							router.push("/todos");
						}
					}>
						<h3 className="text-xl font-semibold mb-2">1. Todo List</h3>
						<p className="mb-4">タスクを管理するためのTodoリストです。</p>
					</button>
				</div>
				<div className="p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
					<button
						className={"block bg-white dark:bg-gray-900 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-1 hover:scale-105 p-6 relative"}
						onClick={() => {
							router.push("/scrap");
						}
					}>
						<h3 className="text-xl font-semibold mb-2">2. Scrap Book</h3>
						<p className="mb-4">情報を保存するためのスクラップブックです。</p>
					</button>
				</div>
				<div className="p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
					<button
						className={"block bg-white dark:bg-gray-900 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-1 hover:scale-105 p-6 relative"}
						onClick={() => {
							router.push("/rss");
						}
					}>
						<h3 className="text-xl font-semibold mb-2">3. RSSリーダー</h3>
						<p className="mb-4">ウェブサイトやサービスからの情報を一元的に収集・閲覧できるRSSリーダーです。</p>
					</button>
				</div>
				<div className="p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
					<button
						className={"block bg-white dark:bg-gray-900 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-1 hover:scale-105 p-6 relative"}
						onClick={() => {
							router.push("/rss/info");
						}
					}>
						<h3 className="text-xl font-semibold mb-2">4. 情報ダッシュボード</h3>
						<p className="mb-4">収集した記事を一覧で確認できる情報ダッシュボードです。</p>
					</button>
				</div>
			</div>
		</div>
	);
}
