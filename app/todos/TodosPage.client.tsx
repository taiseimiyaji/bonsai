"use client";
import {
	createTodo,
	deleteTodo,
	getTodos,
	updateTodo,
} from "@/app/todos/action";
import { PrismaClient } from "@prisma/client";
import { useEffect, useState } from "react";

const prisma = new PrismaClient();

export default function TodosPageClient(props: { initialTodos: any }) {
	const [newTodo, setNewTodo] = useState("");

	const handleCheck = async (todoId: string, completed: boolean) => {
		const formData = new FormData();
		formData.append("id", todoId);
		formData.append("completed", completed ? "true" : "false");
		await updateTodo(todoId, formData);
		window.location.reload();
	};

	const handleCreate = async () => {
		const formData = new FormData();
		formData.append("title", newTodo);
		try {
			await createTodo(formData);
		} catch (e) {
			console.error(e);
		}
		// 作成完了後にリロードする
		window.location.reload();
	};

	const handleDelete = async (todoId: string) => {
		const formData = new FormData();
		formData.append("id", todoId);
		await deleteTodo(todoId);
		window.location.reload();
	};

	return (
		<div>
			<form onSubmit={handleCreate}>
				<input
					type="text"
					name="title"
					value={newTodo}
					onChange={(e) => setNewTodo(e.target.value)}
					placeholder="Add new Todo"
					className="border border-gray-300 p-3 m-3 rounded-md text-black"
				/>
				<button
					className="bg-blue-500 text-white px-3 py-1 rounded-md"
					type="submit"
				>
					Add
				</button>
			</form>
			<ul>
				{props.initialTodos?.map((todo: any) => (
					<div
						key={todo.id}
						className="border border-gray-300 p-3 m-3 rounded-md"
					>
						<div className="flex items-center">
							<input
								type="checkbox"
								checked={todo.completed}
								onChange={(e) => handleCheck(todo.id, e.target.checked)}
							/>
							<span className="m-3">{todo.title}</span>
							<button
								type={"button"}
								className="ml-auto bg-red-500 text-white px-3 py-1 rounded-md"
								onClick={() => handleDelete(todo.id)}
							>
								Delete
							</button>
						</div>
					</div>
				))}
			</ul>
		</div>
	);
}
