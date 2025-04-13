"use client";
import { useState } from "react";
import { trpc } from "@/app/trpc-client";
import { toast } from "react-hot-toast";
import { TodoStatus } from "@prisma/client";
import TodoKanban from "./components/TodoKanban";
import TodoForm from "./components/TodoForm";

export default function TodosPageClient(props: {
	initialTodos: any;
	userId: string;
}) {
	const [newTodo, setNewTodo] = useState("");
	const [todos, setTodos] = useState(props.initialTodos);
	const [editingTodo, setEditingTodo] = useState<any | null>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	
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
			setIsEditModalOpen(false);
			setEditingTodo(null);
			toast.success("タスクが更新されました");
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

	const updateStatusMutation = trpc.todo.update.useMutation({
		onMutate: async (newData) => {
			await utils.todo.getAll.cancel();
			const previousTodos = utils.todo.getAll.getData();

			if (previousTodos) {
				const updatedTodos = previousTodos.todos.map(todo =>
					todo.id === newData.id ? { 
						...todo, 
						status: newData.data.status as TodoStatus,
						order: newData.data.order !== undefined ? newData.data.order : todo.order
					} : todo
				);
				utils.todo.getAll.setData(undefined, { todos: updatedTodos });
				setTodos(updatedTodos);
			}
			return { previousTodos };
		},
		onError: (err, newData, context) => {
			if (context?.previousTodos) {
				utils.todo.getAll.setData(undefined, context.previousTodos);
				setTodos(context.previousTodos.todos);
			}
			toast.error(`ステータス更新エラー: ${err.message}`);
		},
		onSuccess: () => {
			utils.todo.getAll.invalidate();
		}
	});

	const updateOrderMutation = trpc.todo.updateOrder.useMutation({
		onMutate: async (newData) => {
			await utils.todo.getAll.cancel();
			const previousTodos = utils.todo.getAll.getData();

			if (previousTodos) {
				const updatedTodos = previousTodos.todos.map(todo => 
					todo.id === newData.taskId ? { ...todo, order: newData.newOrder } : todo
				);
				utils.todo.getAll.setData(undefined, { todos: updatedTodos });
				setTodos(updatedTodos); 
			}

			return { previousTodos };
		},
		onError: (err, newData, context) => {
			if (context?.previousTodos) {
				utils.todo.getAll.setData(undefined, context.previousTodos);
				setTodos(context.previousTodos.todos);
			}
			toast.error(`エラー: ${err.message}`);
		},
		onSettled: () => {
			utils.todo.getAll.invalidate();
		}
	});

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

	const handleDelete = async (id: string) => {
		if (window.confirm("このタスクを削除してもよろしいですか？")) {
			deleteMutation.mutate({ id }, {
				onSuccess: refreshTodos
			});
		}
	};

	const handleStatusChange = async (
		taskId: string,
		newStatus: TodoStatus,
		newOrder?: number
	) => {
		// データの準備
		const taskData: any = {
			status: newStatus
		};
		
		// 順序が指定されている場合は追加
		if (newOrder !== undefined) {
			taskData.order = newOrder;
		}
		
		// ミューテーションを実行
		updateStatusMutation.mutate({
			id: taskId,
			data: taskData
		});
	};

	const handleOrderChange = async (taskId: string, newOrder: number) => {
		updateOrderMutation.mutate({ taskId, newOrder });
	};

	// タスク編集ハンドラ
	const handleEdit = (todo: any) => {
		setEditingTodo(todo);
		setIsEditModalOpen(true);
	};

	// タスク更新ハンドラ
	const handleUpdate = (data: any) => {
		if (editingTodo) {
			// データの深いコピーを作成して変更
			const updatedData = { ...data };
			
			// dueDateが存在する場合は適切なDate型に変換
			if (updatedData.dueDate) {
				// 既にDate型の場合はそのまま、そうでなければ変換
				updatedData.dueDate = updatedData.dueDate instanceof Date 
					? updatedData.dueDate 
					: new Date(updatedData.dueDate);
			}
			
			updateMutation.mutate({
				id: editingTodo.id,
				data: {
					...updatedData,
					completed: editingTodo.completed
				}
			});
		}
	};

	// 新しいタスク追加ハンドラ（ステータス指定）
	const handleAddTask = async (status: TodoStatus) => {
		createMutation.mutate({
			title: "新しいタスク",
			status,
			completed: false
		});
	};

	const refreshTodos = async () => {
		const result = await utils.todo.getAll.fetch();
		if (result.todos) {
			setTodos(result.todos);
		}
	};

	return (
		<div className="container mx-auto p-4 max-w-6xl">
			<h1 className="text-3xl font-bold mb-6 text-white">タスク管理</h1>
			
			{/* シンプルなTODO追加フォーム */}
			<form onSubmit={handleCreate} className="mb-6 bg-gray-800 p-4 rounded-lg shadow-md">
				<div className="flex items-center">
					<input
						type="text"
						name="title"
						value={newTodo}
						onChange={(e) => setNewTodo(e.target.value)}
						placeholder="新しいタスクを追加"
						className="flex-grow p-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<button
						className="ml-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						type="submit"
						disabled={createMutation.isLoading}
					>
						{createMutation.isLoading ? "追加中..." : "追加"}
					</button>
				</div>
			</form>
			
			{/* カンバンボード表示 */}
			<div className="mt-8">
				<TodoKanban
					todos={todos}
					onToggleComplete={(id, completed) => {
						updateMutation.mutate({
							id,
							data: { completed }
						});
					}}
					onDelete={handleDelete}
					onEdit={handleEdit}
					onStatusChange={handleStatusChange}
					onAddTask={handleAddTask}
					onOrderChange={handleOrderChange}
				/>
			</div>

			{isEditModalOpen && editingTodo && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
					<div className="w-full max-w-md rounded-lg bg-gray-800 p-6">
						<TodoForm
							initialData={editingTodo}
							onSubmit={handleUpdate}
							onCancel={() => {
								setIsEditModalOpen(false);
								setEditingTodo(null);
							}}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
