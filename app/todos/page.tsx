import { auth } from "@/auth";
import { trpcCaller } from "@/app/api/trpc/trpc-server";
import TodosPageClient from "./TodosPage.client";

export default async function TodosIndexPage() {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("Authentication required. Please log in.");
	}
	const userId = session.user.id;
	
	// tRPCを使用してTodoリストを取得
	const { todos } = await trpcCaller(caller => caller.todo.getAll());
	
	return (
		<div className="min-h-screen bg-gray-900">
			<TodosPageClient initialTodos={todos ?? []} userId={userId} />
		</div>
	);
}
