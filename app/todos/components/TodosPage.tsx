"use client";

import { useState } from "react";
import { trpc } from "@/app/trpc-client";
import { toast } from "react-hot-toast";
import TodoList from "./TodoList";
import TodoKanban from "./TodoKanban";
import TodoForm from "./TodoForm";
import TodoFilter from "./TodoFilter";
import TodoCategory from "./TodoCategory";
import { TodoPriority, TodoStatus } from "@prisma/client";

type ViewMode = "list" | "kanban" | "category";

type TodosPageProps = {
  initialTodos: any[];
  userId: string;
};

export default function TodosPage({ initialTodos, userId }: TodosPageProps) {
  // 状態管理
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<any | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [sort, setSort] = useState<any>({ field: "order", direction: "asc" });

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
      utils.todo.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
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
      // 新規作成
      createMutation.mutate(data);
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
    updateMutation.mutate({
      id,
      data: { completed },
    });
  };

  // タスクの順序変更
  const handleOrderChange = (taskId: string, newOrder: number, newParentId?: string | null) => {
    updateOrderMutation.mutate({
      taskId,
      newOrder,
      newParentId,
    });
  };

  // タスクのステータス変更（カンバン表示用）
  const handleStatusChange = (id: string, status: TodoStatus) => {
    updateMutation.mutate({
      id,
      data: { 
        status,
        // ステータスがDONEに変更された場合は、completedもtrueに設定
        completed: status === "DONE"
      },
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

  return (
    <div className="container mx-auto p-4 bg-gray-900">
      {/* ヘッダー */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">TODOリスト</h1>
        
        <div className="flex flex-wrap gap-2">
          {/* 表示モード切替 */}
          <div className="flex rounded-md border border-gray-700 bg-gray-800">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              リスト
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-4 py-2 ${
                viewMode === "kanban"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              カンバン
            </button>
            <button
              onClick={() => setViewMode("category")}
              className={`px-4 py-2 ${
                viewMode === "category"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              カテゴリ
            </button>
          </div>
          
          {/* アクションボタン */}
          <button
            onClick={() => {
              setEditingTodo(null);
              setIsFormOpen(!isFormOpen);
            }}
            className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            {isFormOpen ? "キャンセル" : "新規タスク"}
          </button>
          
          <button
            onClick={handleDeleteCompleted}
            className="rounded-md border border-red-500 bg-gray-800 px-4 py-2 text-red-400 hover:bg-gray-700"
          >
            完了済みを削除
          </button>
        </div>
      </div>

      {/* タスク作成・編集フォーム */}
      {isFormOpen && (
        <div className="mb-6 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-white">
            {editingTodo ? "タスクを編集" : "新規タスク"}
          </h2>
          <TodoForm
            initialData={editingTodo}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingTodo(null);
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
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        </div>
      )}

      {/* コンテンツ */}
      {!isLoading && (
        <div className="mt-4">
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
              onEdit={handleEdit}
              onStatusChange={handleStatusChange}
            />
          )}

          {viewMode === "category" && <TodoCategory />}
        </div>
      )}
    </div>
  );
}
