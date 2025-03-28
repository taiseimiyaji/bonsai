import { nextAuthOptions } from "@/app/_utils/next-auth-options";
import { getTodos } from "@/app/todos/action";
import { getServerSession } from "next-auth";
import TodosPageClient from "./TodosPage.client";

export default async function TodosIndexPage() {
	const session = await getServerSession(nextAuthOptions);
	if (!session) {
		throw new Error("Session is not found");
	}
	const userId = session.userId;
	const todos = await getTodos({ userId: userId });
	return (
		<div>
			<h1 className="m-3 text-3xl">Your Todo List</h1>
			<TodosPageClient initialTodos={todos} userId={userId || ""} />
		</div>
	);
}
