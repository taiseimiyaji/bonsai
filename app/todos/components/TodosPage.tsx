"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/app/trpc-client";
import { toast } from "react-hot-toast";
import TodoList from "./TodoList";
import TodoKanban from "./TodoKanban";
import TodoForm from "./TodoForm";
import TodoFilter from "./TodoFilter";
import TodoCategory from "./TodoCategory";
import { TodoPriority, TodoStatus } from "@prisma/client";
import { useOptimisticTodos } from "../hooks/useOptimisticTodos";

type ViewMode = "list" | "kanban" | "category";

type TodosPageProps = {
  initialTodos: any[];
  userId: string;
};

export default function TodosPage({ initialTodos, userId }: TodosPageProps) {
  // デフォルトはリスト表示
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  
  // ローカルストレージからビューモードを取得（クライアントサイドのみ）
  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("todoViewMode");
      if (savedMode) {
        setViewMode(savedMode as ViewMode);
      }
    }
  }, []);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<any | null>(null);
  const [initialStatus, setInitialStatus] = useState<TodoStatus | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [sort, setSort] = useState<any>({ field: "order", direction: "asc" });

  // ビューモードが変更されたらローカルストレージに保存
  useEffect(() => {
    localStorage.setItem("todoViewMode", viewMode);
  }, [viewMode]);

  // tRPCクエリとミューテーション
  const utils = trpc.useContext();
  
  const { data, isLoading } = trpc.todo.getAll.useQuery(
    { filters, sort },
    {
      initialData: { todos: initialTodos },
      refetchOnWindowFocus: false,
    }
  );
  
  const todos = data?.todos || [];

  // タスク作成ミューテーション
  const createMutation = trpc.todo.create.useMutation({
    onSuccess: () => {
      toast.success("タスクを作成しました");
      setIsFormOpen(false);
      setInitialStatus(null);
      utils.todo.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
    },
  });

  // タスク更新ミューテーション
  const updateMutation = trpc.todo.update.useMutation({
    onSuccess: () => {
      toast.success("タスクを更新しました");
      setEditingTodo(null);
      utils.todo.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
    },
  });

  // タスク削除ミューテーション
  const deleteMutation = trpc.todo.delete.useMutation({
    onSuccess: () => {
      toast.success("タスクを削除しました");
      utils.todo.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
    },
  });

  // タスク順序更新ミューテーション
  const updateOrderMutation = trpc.todo.updateOrder.useMutation({
    onSuccess: () => {
      // 成功時にキャッシュを更新
      utils.todo.getAll.invalidate({ filters, sort });
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
      // エラー時にキャッシュを再検証して元の状態に戻す
      utils.todo.getAll.invalidate({ filters, sort });
    },
  });

  // 完了済みタスク一括削除ミューテーション
  const deleteCompletedMutation = trpc.todo.deleteCompleted.useMutation({
    onSuccess: () => {
      toast.success("完了済みのタスクを削除しました");
      utils.todo.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
    },
  });

  // タスク作成・更新の処理
  const handleSubmit = (data: any) => {
    if (editingTodo) {
      // 更新
      updateMutation.mutate({
        id: editingTodo.id,
        data,
      });
    } else {
      // 新規作成（初期ステータスが設定されている場合はそれを使用）
      createMutation.mutate({
        ...data,
        status: initialStatus || data.status,
      });
    }
  };

  // タスク編集の開始
  const handleEdit = (todo: any) => {
    setEditingTodo(todo);
    setIsFormOpen(true);
  };

  // タスク削除の処理
  const handleDelete = (id: string) => {
    if (confirm("このタスクを削除してもよろしいですか？サブタスクも削除されます。")) {
      deleteMutation.mutate({ id });
    }
  };

  // 完了状態の切り替え
  const handleToggleComplete = (id: string, completed: boolean) => {
    // 現在のtodosの配列をコピー
    const updatedTodos = [...todos];
    
    // 変更するタスクを見つける
    const taskIndex = updatedTodos.findIndex(t => t.id === id);
    if (taskIndex === -1) return;
    
    // タスクの完了状態を更新
    updatedTodos[taskIndex].completed = completed;
    
    // 完了状態に変更された場合は、ステータスもDONEに設定
    if (completed && updatedTodos[taskIndex].status !== "DONE") {
      updatedTodos[taskIndex].status = "DONE";
    }
    // 未完了状態に変更された場合で、ステータスがDONEだった場合はTODOに戻す
    else if (!completed && updatedTodos[taskIndex].status === "DONE") {
      updatedTodos[taskIndex].status = "TODO";
    }
    
    // UIを即時更新するために、データをローカルで更新
    utils.todo.getAll.setData({ filters, sort }, { todos: updatedTodos });
    
    // サーバーに更新を送信
    updateMutation.mutate({
      id,
      data: { 
        completed,
        // 完了状態に応じてステータスも更新
        status: completed ? "DONE" : updatedTodos[taskIndex].status === "DONE" ? "TODO" : updatedTodos[taskIndex].status
      },
    });
  };

  // タスクの順序変更
  const handleOrderChange = (taskId: string, newOrder: number, newParentId?: string | null) => {
    // 現在のtodosの配列をコピー
    const updatedTodos = [...todos];
    
    // 移動するタスクを見つける
    const taskIndex = updatedTodos.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    const taskToMove = updatedTodos[taskIndex];
    const currentStatus = taskToMove.status;
    
    // 同じステータスのタスクを取得（親タスクでないもの）
    const tasksWithSameStatus = updatedTodos.filter(
      t => t.status === currentStatus && !t.parentId && t.id !== taskId
    );
    
    // 挿入位置に基づいて順序を更新
    const reorderedTasks = [
      ...tasksWithSameStatus.slice(0, newOrder),
      taskToMove,
      ...tasksWithSameStatus.slice(newOrder)
    ];
    
    // 順序を更新
    reorderedTasks.forEach((todo, index) => {
      const todoIndex = updatedTodos.findIndex(t => t.id === todo.id);
      if (todoIndex !== -1) {
        updatedTodos[todoIndex].order = index;
      }
    });
    
    // UIを即時更新するために、データをローカルで更新
    utils.todo.getAll.setData({ filters, sort }, { todos: updatedTodos });
    
    // サーバーに更新を送信
    updateOrderMutation.mutate({
      taskId,
      newOrder,
      newParentId,
    }, {
      // エラー時のみロールバック
      onError: (err) => {
        // エラー時には元のデータを再取得
        utils.todo.getAll.invalidate({ filters, sort });
        toast.error(`エラー: ${err.message}`);
      }
    });
  };

  // タスクのステータス変更（カンバン表示用）
  const handleStatusChange = (id: string, status: TodoStatus, destinationIndex: number) => {
    // 現在のtodosの配列をコピー
    const updatedTodos = [...todos];
    
    // 変更するタスクを見つける
    const taskIndex = updatedTodos.findIndex(t => t.id === id);
    if (taskIndex === -1) return;
    
    const taskToMove = updatedTodos[taskIndex];
    const previousStatus = taskToMove.status;
    
    // タスクのステータスを更新
    taskToMove.status = status;
    
    // DONEに変更された場合はcompletedもtrueに設定
    if (status === "DONE") {
      taskToMove.completed = true;
    }
    
    // 移動先の同じステータスのタスクを取得（親タスクでないもの）
    const tasksWithDestStatus = updatedTodos.filter(
      t => t.status === status && !t.parentId && t.id !== id
    );
    
    // 挿入位置に基づいて新しいorderを計算
    let newOrder = 0;
    
    if (tasksWithDestStatus.length === 0) {
      // 移動先に他のタスクがない場合は0
      newOrder = 0;
    } else if (destinationIndex >= tasksWithDestStatus.length) {
      // 最後に挿入する場合は、最後のタスクのorder + 1
      newOrder = Math.max(...tasksWithDestStatus.map(t => t.order)) + 1;
    } else {
      // 間に挿入する場合
      // 挿入位置のタスクのorderを取得
      const orderAtDestination = tasksWithDestStatus[destinationIndex].order;
      
      if (destinationIndex > 0) {
        // 前のタスクのorderがある場合
        const prevOrder = tasksWithDestStatus[destinationIndex - 1].order;
        // 前後のタスクの間に挿入
        newOrder = prevOrder + (orderAtDestination - prevOrder) / 2;
      } else {
        // 先頭に挿入する場合
        newOrder = orderAtDestination / 2;
      }
    }
    
    // タスクのorderを更新
    taskToMove.order = newOrder;
    
    // UIを即時更新するために、データをローカルで更新
    utils.todo.getAll.setData({ filters, sort }, { todos: updatedTodos });
    
    // サーバーに更新を送信
    updateMutation.mutate({
      id,
      data: { 
        status,
        completed: status === "DONE",
        order: newOrder
      },
    }, {
      // エラー時のみロールバック
      onError: (err) => {
        // エラー時には元のデータを再取得
        utils.todo.getAll.invalidate({ filters, sort });
        toast.error(`エラー: ${err.message}`);
      }
    });
  };

  // 完了済みタスクの一括削除
  const handleDeleteCompleted = () => {
    if (confirm("完了済みのタスクをすべて削除してもよろしいですか？")) {
      deleteCompletedMutation.mutate();
    }
  };

  // フィルターの変更
  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  // ソートの変更
  const handleSortChange = (newSort: any) => {
    setSort(newSort);
  };

  // カンバン表示で新しいタスクを追加
  const handleAddTaskWithStatus = (status: TodoStatus) => {
    setInitialStatus(status);
    setEditingTodo(null);
    setIsFormOpen(true);
  };

  return (
    <div className="container mx-auto p-3 bg-gray-900 sm:p-4">
      {/* ヘッダー */}
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:mb-6 sm:flex-row sm:items-center">
        <h1 className="text-xl font-bold text-white sm:text-2xl">TODOリスト</h1>
        
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-2">
          {/* 表示モード切替 */}
          <div className="grid grid-cols-3 rounded-md border border-gray-700 bg-gray-800 sm:flex">
            <button
              onClick={() => setViewMode("list")}
              className={`min-h-[44px] px-3 py-2 text-sm ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:px-4`}
            >
              <span className="flex items-center justify-center">
                <svg className="mr-1 h-4 w-4 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span className="hidden sm:inline">リスト</span>
              </span>
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`min-h-[44px] px-3 py-2 text-sm ${
                viewMode === "kanban"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:px-4`}
            >
              <span className="flex items-center justify-center">
                <svg className="mr-1 h-4 w-4 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
                <span className="hidden sm:inline">カンバン</span>
              </span>
            </button>
            <button
              onClick={() => setViewMode("category")}
              className={`min-h-[44px] px-3 py-2 text-sm ${
                viewMode === "category"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:px-4`}
            >
              <span className="flex items-center justify-center">
                <svg className="mr-1 h-4 w-4 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="hidden sm:inline">カテゴリ</span>
              </span>
            </button>
          </div>
          
          {/* アクションボタン */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
            <button
              onClick={() => {
                setEditingTodo(null);
                setInitialStatus(null);
                setIsFormOpen(!isFormOpen);
              }}
              className="min-h-[44px] rounded-md bg-green-600 px-4 py-2 text-base text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:text-sm"
            >
              {isFormOpen ? "キャンセル" : "新規タスク"}
            </button>
            
            <button
              onClick={handleDeleteCompleted}
              className="min-h-[44px] rounded-md border border-red-500 bg-gray-800 px-4 py-2 text-base text-red-400 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:text-sm"
            >
              完了済みを削除
            </button>
          </div>
        </div>
      </div>

      {/* タスク作成・編集フォーム */}
      {isFormOpen && (
        <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-md sm:mb-6 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-white sm:text-xl">
            {editingTodo ? "タスクを編集" : "新規タスク"}
            {initialStatus && !editingTodo && (
              <span className="ml-2 text-sm text-gray-400 block sm:inline">
                ({initialStatus === "TODO" ? "未着手" : initialStatus === "IN_PROGRESS" ? "進行中" : "完了"}に追加)
              </span>
            )}
          </h2>
          <TodoForm
            initialData={editingTodo ? editingTodo : initialStatus ? { status: initialStatus } : undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingTodo(null);
              setInitialStatus(null);
            }}
          />
        </div>
      )}

      {/* フィルター（リストとカンバン表示時のみ表示） */}
      {viewMode !== "category" && (
        <TodoFilter
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          initialFilters={filters}
          initialSort={sort}
        />
      )}

      {/* ローディング表示 */}
      {isLoading && (
        <div className="flex justify-center py-12 sm:py-8">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-500 sm:h-8 sm:w-8"></div>
        </div>
      )}

      {/* コンテンツ */}
      {!isLoading && (
        <div className="mt-3 sm:mt-4">
          {viewMode === "list" && (
            <TodoList
              todos={todos}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onOrderChange={handleOrderChange}
            />
          )}

          {viewMode === "kanban" && (
            <TodoKanban
              todos={todos}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDelete}
              onArchive={handleDelete} // 一時的にonDeleteを使用
              onEdit={handleEdit}
              onStatusChange={handleStatusChange}
              onAddTask={handleAddTaskWithStatus}
              onOrderChange={handleOrderChange}
            />
          )}

          {viewMode === "category" && <TodoCategory />}
        </div>
      )}
    </div>
  );
}
