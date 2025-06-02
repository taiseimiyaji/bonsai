"use client";

import { useState } from "react";
import { trpc } from "@/app/trpc-client";
import { toast } from "react-hot-toast";

type CategoryFormData = {
  id?: string;
  name: string;
  color: string;
};

export default function TodoCategory() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryFormData | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    color: "#3B82F6", // デフォルトは青色
  });

  // カテゴリ一覧を取得
  const { data: categoriesData, refetch } = trpc.todo.getCategories.useQuery();
  const categories = categoriesData?.categories || [];

  // カテゴリ作成ミューテーション
  const createMutation = trpc.todo.createCategory.useMutation({
    onSuccess: () => {
      toast.success("カテゴリを作成しました");
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
    },
  });

  // カテゴリ更新ミューテーション
  const updateMutation = trpc.todo.updateCategory.useMutation({
    onSuccess: () => {
      toast.success("カテゴリを更新しました");
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
    },
  });

  // カテゴリ削除ミューテーション
  const deleteMutation = trpc.todo.deleteCategory.useMutation({
    onSuccess: () => {
      toast.success("カテゴリを削除しました");
      refetch();
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
    },
  });

  // フォームをリセット
  const resetForm = () => {
    setFormData({
      name: "",
      color: "#3B82F6",
    });
    setEditingCategory(null);
    setIsFormOpen(false);
  };

  // カテゴリの編集を開始
  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      id: category.id,
      name: category.name,
      color: category.color,
    });
    setIsFormOpen(true);
  };

  // カテゴリの削除
  const handleDelete = (id: string) => {
    if (confirm("このカテゴリを削除してもよろしいですか？関連するタスクからはカテゴリが削除されます。")) {
      deleteMutation.mutate({ id });
    }
  };

  // フォームの送信
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("カテゴリ名を入力してください");
      return;
    }
    
    if (editingCategory && editingCategory.id) {
      // 更新
      updateMutation.mutate({
        id: editingCategory.id,
        data: {
          name: formData.name,
          color: formData.color,
        },
      });
    } else {
      // 新規作成
      createMutation.mutate({
        name: formData.name,
        color: formData.color,
      });
    }
  };

  return (
    <div className="space-y-4 p-3 sm:space-y-6 sm:p-0">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-lg font-semibold text-white sm:text-xl">カテゴリ管理</h2>
        <button
          onClick={() => {
            resetForm();
            setIsFormOpen(!isFormOpen);
          }}
          className="min-h-[44px] w-full rounded-md bg-blue-600 px-4 py-3 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:w-auto sm:text-sm"
        >
          {isFormOpen ? "キャンセル" : "カテゴリを追加"}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-md sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="name" className="block text-base font-medium text-gray-200 sm:text-sm">
                カテゴリ名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-2 block w-full min-h-[44px] rounded-md border border-gray-600 bg-gray-700 px-3 py-3 text-base text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:mt-1 sm:px-2 sm:py-2 sm:text-sm"
                placeholder="カテゴリ名を入力"
                required
              />
            </div>

            <div>
              <label htmlFor="color" className="block text-base font-medium text-gray-200 sm:text-sm">
                カラー
              </label>
              <div className="mt-2 flex flex-col space-y-3 sm:mt-1 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
                <input
                  type="color"
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-12 w-full rounded-md border border-gray-600 bg-transparent sm:h-10 sm:w-10"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="block w-full min-h-[44px] rounded-md border border-gray-600 bg-gray-700 px-3 py-3 text-base text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:px-2 sm:py-2 sm:text-sm"
                  placeholder="#RRGGBB"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={createMutation.isLoading || updateMutation.isLoading}
                className="min-h-[44px] w-full rounded-md bg-blue-600 px-4 py-3 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:w-auto sm:text-sm"
              >
                {createMutation.isLoading || updateMutation.isLoading
                  ? "保存中..."
                  : editingCategory
                  ? "更新"
                  : "作成"}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="mt-4 sm:mt-6">
        <h3 className="mb-3 text-base font-medium text-white sm:text-lg">カテゴリ一覧</h3>
        {categories.length === 0 ? (
          <p className="text-center text-base text-gray-400 py-8 sm:text-left sm:text-sm sm:py-4">カテゴリがありません</p>
        ) : (
          <div className="space-y-3 sm:space-y-2">
            {categories.map((category: any) => (
              <div
                key={category.id}
                className="flex flex-col space-y-3 rounded-md border border-gray-700 bg-gray-800 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:p-3"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="h-8 w-8 rounded-full sm:h-6 sm:w-6"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-base text-white sm:text-sm">{category.name}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="min-h-[44px] flex-1 rounded-md bg-blue-900/50 px-4 py-3 text-base text-blue-300 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:min-h-0 sm:flex-none sm:px-3 sm:py-1 sm:text-sm"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="min-h-[44px] flex-1 rounded-md bg-red-900/50 px-4 py-3 text-base text-red-300 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:min-h-0 sm:flex-none sm:px-3 sm:py-1 sm:text-sm"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
