"use client";
import { useState, useEffect } from "react";
import { trpc } from "@/app/trpc-client";
import { toast } from "react-hot-toast";
import { TodoStatus } from "@prisma/client";
import TodoKanban from "./components/TodoKanban";
import TodoForm from "./components/TodoForm";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function TodosPageClient(props: {
	initialTodos: any;
	userId: string;
}) {
	// ============ 全てのHooksを最初に定義 ============
	const [newTodo, setNewTodo] = useState("");
	const [editingTodo, setEditingTodo] = useState<any | null>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const router = useRouter();
	const { status } = useSession();
	
	// tRPC関連のHooks
	const utils = trpc.useUtils();
	const todosQuery = trpc.todo.getAll.useQuery(undefined, {
		...(props.initialTodos.length > 0 && { initialData: { todos: props.initialTodos } }),
		enabled: status === "authenticated",
		refetchOnWindowFocus: false,
		refetchOnMount: props.initialTodos.length === 0, // 初期データがない場合のみfetch
		refetchOnReconnect: false,
		staleTime: 10 * 60 * 1000, // 10分間はstaleにならない
		retry: (failureCount, error) => {
			if (error.data?.code === 'UNAUTHORIZED') {
				console.error('認証エラー:', error);
				router.push("/auth/signin");
				return false;
			}
			return failureCount < 3;
		},
		onError: (error) => {
			console.error('TODOクエリエラー:', error);
			if (error.data?.code === 'UNAUTHORIZED') {
				router.push("/auth/signin");
			}
		},
	});

	const createMutation = trpc.todo.create.useMutation({
		onSuccess: () => {
			setNewTodo("");
			utils.todo.getAll.invalidate();
			toast.success("Todoが追加されました");
		},
		onError: (error) => {
			if (error.data?.code === 'UNAUTHORIZED') {
				router.push("/auth/signin");
				return;
			}
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
			if (error.data?.code === 'UNAUTHORIZED') {
				router.push("/auth/signin");
				return;
			}
			toast.error(`エラー: ${error.message}`);
		}
	});

	const deleteMutation = trpc.todo.delete.useMutation({
		onSuccess: () => {
			utils.todo.getAll.invalidate();
			toast.success("Todoが削除されました");
		},
		onError: (error) => {
			if (error.data?.code === 'UNAUTHORIZED') {
				router.push("/auth/signin");
				return;
			}
			toast.error(`エラー: ${error.message}`);
		}
	});

	const archiveMutation = trpc.todo.archive.useMutation({
		onSuccess: () => {
			utils.todo.getAll.invalidate();
			toast.success("Todoをアーカイブしました");
		},
		onError: (error) => {
			if (error.data?.code === 'UNAUTHORIZED') {
				router.push("/auth/signin");
				return;
			}
			toast.error(`エラー: ${error.message}`);
		}
	});

	const updateStatusMutation = trpc.todo.update.useMutation({
		onMutate: async (variables) => {
			// クエリをキャンセルして楽観的更新が上書きされないようにする
			await utils.todo.getAll.cancel();
			
			// 現在のデータのスナップショットを取得
			const previousTodos = utils.todo.getAll.getData();
			
			// 楽観的更新を実行
			utils.todo.getAll.setData(undefined, (old) => {
				if (!old) return old;
				return {
					todos: old.todos.map((todo) => {
						if (todo.id === variables.id) {
							return { 
								...todo, 
								...variables.data,
								// Date型の場合は文字列に変換
								...(variables.data.dueDate instanceof Date && {
									dueDate: variables.data.dueDate.toISOString()
								})
							} as typeof todo;
						}
						return todo;
					}),
				};
			});
			
			return { previousTodos };
		},
		onError: (error, variables, context) => {
			// エラー時は元のデータに戻す
			if (context?.previousTodos) {
				utils.todo.getAll.setData(undefined, context.previousTodos);
			}
			if (error.data?.code === 'UNAUTHORIZED') {
				router.push("/auth/signin");
				return;
			}
			toast.error(`ステータス更新エラー: ${error.message}`);
		},
		onSettled: () => {
			// 最終的にサーバーデータと同期（ただし、invalidateはしない）
			// utils.todo.getAll.invalidate();
		}
	});

	const updateOrderMutation = trpc.todo.updateOrder.useMutation({
		onMutate: async (variables) => {
			await utils.todo.getAll.cancel();
			const previousTodos = utils.todo.getAll.getData();
			
			// 楽観的更新
			utils.todo.getAll.setData(undefined, (old) => {
				if (!old) return old;
				return {
					todos: old.todos.map((todo) => {
						if (todo.id === variables.taskId) {
							return { ...todo, order: variables.newOrder };
						}
						return todo;
					}),
				};
			});
			
			return { previousTodos };
		},
		onError: (error, variables, context) => {
			if (context?.previousTodos) {
				utils.todo.getAll.setData(undefined, context.previousTodos);
			}
			if (error.data?.code === 'UNAUTHORIZED') {
				router.push("/auth/signin");
				return;
			}
			toast.error(`エラー: ${error.message}`);
		},
		onSettled: () => {
			// 最終的にサーバーデータと同期（ただし、invalidateはしない）
			// utils.todo.getAll.invalidate();
		}
	});

	// useEffect
	useEffect(() => {
		if (status === "unauthenticated") {
			console.log('TODOクライアント - セッション未認証のためリダイレクト');
			router.push("/auth/signin");
		}
	}, [status, router]);

	// ============ 条件分岐による早期リターン ============
	if (status === "loading") {
		return (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-white">ロード中...</div>
			</div>
		);
	}

	if (status === "unauthenticated") {
		return null;
	}

	// ============ イベントハンドラー ============
	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newTodo.trim()) {
			toast.error("タイトルを入力してください");
			return;
		}
		
		createMutation.mutate({
			title: newTodo,
		});
	};

	const handleDelete = async (id: string) => {
		if (window.confirm("このタスクを削除してもよろしいですか？")) {
			deleteMutation.mutate({ id });
		}
	};

	const handleArchive = async (id: string) => {
		archiveMutation.mutate({ id });
	};

	const handleStatusChange = async (
		taskId: string,
		newStatus: TodoStatus,
		newOrder?: number
	) => {
		console.log('handleStatusChange called:', { taskId, newStatus, newOrder });
		
		const taskData: any = {
			status: newStatus
		};
		
		if (newOrder !== undefined) {
			taskData.order = newOrder;
		}
		
		updateStatusMutation.mutate({
			id: taskId,
			data: taskData
		});
	};

	const handleOrderChange = async (taskId: string, newOrder: number) => {
		updateOrderMutation.mutate({ taskId, newOrder });
	};

	const handleEdit = (todo: any) => {
		setEditingTodo(todo);
		setIsEditModalOpen(true);
	};

	const handleUpdate = (data: any) => {
		if (editingTodo) {
			const updatedData = { ...data };
			
			if (updatedData.dueDate) {
				updatedData.dueDate = updatedData.dueDate instanceof Date 
					? updatedData.dueDate 
					: new Date(updatedData.dueDate);
			}
			
			updateMutation.mutate({
				id: editingTodo.id,
				data: updatedData
			});
		}
	};

	const handleAddTask = async (status: TodoStatus) => {
		createMutation.mutate({
			title: "新しいタスク",
			status,
		});
	};

	// ============ レンダリング ============
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
			<div className="container mx-auto p-6 max-w-7xl">
				<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
					<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">タスク管理</h1>
					
					<form onSubmit={handleCreate} className="flex gap-3">
						<input
							type="text"
							name="title"
							value={newTodo}
							onChange={(e) => setNewTodo(e.target.value)}
							placeholder="新しいタスクを追加..."
							className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
						<button
							className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
							type="submit"
							disabled={createMutation.isLoading}
						>
							{createMutation.isLoading ? "追加中..." : "追加"}
						</button>
					</form>
				</div>
			
				<div className="mt-8">
					<TodoKanban
						todos={todosQuery.data?.todos || []}
						onToggleComplete={(id, completed) => {
							updateMutation.mutate({
								id,
								data: { completed }
							});
						}}
						onDelete={handleDelete}
						onArchive={handleArchive}
						onEdit={handleEdit}
						onStatusChange={handleStatusChange}
						onAddTask={handleAddTask}
						onOrderChange={handleOrderChange}
					/>
				</div>

				{isEditModalOpen && editingTodo && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
						<div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6">
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
		</div>
	);
}