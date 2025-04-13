"use client";
import { useState } from "react";
import { trpc } from "@/app/trpc-client";
import { toast } from "react-hot-toast";

export default function TodosPageClient(props: {
	initialTodos: any;
	userId: string;
}) {
	const [newTodo, setNewTodo] = useState("");
	const [todos, setTodos] = useState(props.initialTodos);
	
	// tRPCのクエリとミューテーションを設定
	const utils = trpc.useContext();
	const todosQuery = trpc.todo.getAll.useQuery(undefined, {
		initialData: { todos: props.initialTodos },
		enabled: false, // 初期データがあるので自動フェッチは無効化
	});
	
	const createMutation = trpc.todo.create.useMutation({
		onSuccess: () => {
			setNewTodo("");
			utils.todo.getAll.invalidate();
			toast.success("Todoが追加されました");
		},
		onError: (error) => {
			toast.error(`エラー: ${error.message}`);
		}
	});
	
	const updateMutation = trpc.todo.update.useMutation({
		onSuccess: () => {
			utils.todo.getAll.invalidate();
		},
		onError: (error) => {
			toast.error(`エラー: ${error.message}`);
		}
	});
	
	const deleteMutation = trpc.todo.delete.useMutation({
		onSuccess: () => {
			utils.todo.getAll.invalidate();
			toast.success("Todoが削除されました");
		},
		onError: (error) => {
			toast.error(`エラー: ${error.message}`);
		}
	});
	
	// データ更新後にtodosを更新
	const refreshTodos = async () => {
		const result = await utils.todo.getAll.fetch();
		if (result.todos) {
			setTodos(result.todos);
		}
	};

	const handleCheck = async (todoId: string, completed: boolean) => {
		updateMutation.mutate({
			id: todoId,
			data: { completed }
		}, {
			onSuccess: refreshTodos
		});
	};

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newTodo.trim()) {
			toast.error("タイトルを入力してください");
			return;
		}
		
		createMutation.mutate({
			title: newTodo,
			completed: false
		}, {
			onSuccess: refreshTodos
		});
	};

	const handleDelete = async (todoId: string) => {
		deleteMutation.mutate({ id: todoId }, {
			onSuccess: refreshTodos
		});
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
					disabled={createMutation.isLoading}
				>
					{createMutation.isLoading ? "追加中..." : "追加"}
				</button>
			</form>
			<ul>
				{todos?.map((todo: any) => (
					<div
						key={todo.id}
						className="border border-gray-300 p-3 m-3 rounded-md"
					>
						<div className="flex items-center">
							<input
								type="checkbox"
								checked={todo.completed}
								onChange={(e) => handleCheck(todo.id, e.target.checked)}
								disabled={updateMutation.isLoading}
							/>
							<span className="m-3">{todo.title}</span>
							<button
								type={"button"}
								className="ml-auto bg-red-500 text-white px-3 py-1 rounded-md"
								onClick={() => handleDelete(todo.id)}
								disabled={deleteMutation.isLoading}
							>
								{deleteMutation.isLoading && deleteMutation.variables?.id === todo.id 
									? "削除中..." 
									: "削除"}
							</button>
						</div>
					</div>
				))}
			</ul>
		</div>
	);
}
