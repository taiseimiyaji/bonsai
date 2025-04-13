import { nextAuthOptions } from "@/app/_utils/next-auth-options";
import { getServerSession } from "next-auth";
import { trpcCaller } from "@/app/api/trpc/trpc-server";
import TodosPage from "./components/TodosPage";

export default async function TodosIndexPage() {
	const session = await getServerSession(nextAuthOptions);
	if (!session) {
		throw new Error("セッションが見つかりません");
	}
	const userId = session.userId;
	
	// tRPCを使用してTodoリストを取得
	const { todos } = await trpcCaller(caller => caller.todo.getAll());
	
	return (
		<div className="min-h-screen bg-gray-900">
			<TodosPage initialTodos={todos} userId={userId || ""} />
		</div>
	);
}
