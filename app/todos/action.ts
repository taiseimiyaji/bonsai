"use server";
import { PrismaClient } from "@prisma/client";
import type { NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function action({ request }: { request: NextRequest }) {
	const data = await request.formData();
	const title = data.get("title") as string;

	if (!title) {
		return {
			status: 400,
			body: { message: "Title is required" },
		};
	}

	const todo = await prisma.todo.create({
		data: { title, completed: false },
	});

	return new Response(null, {
		status: 201,
		headers: { Location: `/todos/${todo.id}` },
	});
}

export async function getTodos() {
	const todos = await prisma.todo.findMany({
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
	return todosFormatted;
}

export async function createTodo(formData: FormData) {
	"use server";
	const rawFormData = {
		title: formData.get("title") as string,
		description: formData.get("description"),
		completed: formData.get("completed") === "true",
	};
	const todo = await prisma.todo.create({
		data: { title: rawFormData.title, completed: false },
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
