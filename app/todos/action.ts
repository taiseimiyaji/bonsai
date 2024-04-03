"use server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getTodos({ userId }: { userId: string | undefined }) {
	"use server";

	const todos = await prisma.todo.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
	});
	// todosをシリアライズして返す
	const todosFormatted = todos.map((todo) => {
		return {
			...todo,
			createdAt: todo.createdAt.toISOString(),
			updatedAt: todo.updatedAt.toISOString(),
		};
	});
	return todos;
}

export async function createTodo(formData: FormData, userId: string) {
	"use server";
	const rawFormData = {
		title: formData.get("title") as string,
		description: formData.get("description"),
		completed: formData.get("completed") === "true",
	};
	if (!userId) {
		throw new Error("User not found");
	}
	const todo = await prisma.todo.create({
		data: { title: rawFormData.title, userId: userId, completed: false },
	});
}

export async function updateTodo(id: string, formData: FormData) {
	"use server";
	const rawFormData = {
		title: formData.get("title") as string,
		description: formData.get("description"),
		completed: formData.get("completed") === "true",
	};
	const todo = await prisma.todo.update({
		where: { id: id },
		data: {
			title: rawFormData.title ?? undefined,
			completed: rawFormData.completed,
		},
	});
}

export async function deleteTodo(id: string) {
	"use server";
	await prisma.todo.delete({ where: { id: id } });
}
