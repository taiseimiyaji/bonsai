import { getTodos } from "@/app/todos/action";
import { PrismaClient } from "@prisma/client";
import TodosPageClient from "./TodosPage.client";

const prisma = new PrismaClient();

export default async function TodosIndexPage() {
	const todos = await getTodos();
	return (
		<div>
			<h1 className="m-3 text-3xl">Todo List</h1>
			<TodosPageClient initialTodos={todos} />
		</div>
	);
}
