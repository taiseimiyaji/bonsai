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
    
    if (editingCategory) {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">カテゴリ管理</h2>
        <button
          onClick={() => {
            resetForm();
            setIsFormOpen(!isFormOpen);
          }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {isFormOpen ? "キャンセル" : "カテゴリを追加"}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-md">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block font-medium text-gray-200">
                カテゴリ名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 p-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="カテゴリ名を入力"
                required
              />
            </div>

            <div>
              <label htmlFor="color" className="block font-medium text-gray-200">
                カラー
              </label>
              <div className="mt-1 flex items-center space-x-2">
                <input
                  type="color"
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-10 rounded-md border border-gray-600 bg-transparent"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="block w-full rounded-md border border-gray-600 bg-gray-700 p-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="#RRGGBB"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={createMutation.isLoading || updateMutation.isLoading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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

      <div className="mt-6">
        <h3 className="mb-3 text-lg font-medium text-white">カテゴリ一覧</h3>
        {categories.length === 0 ? (
          <p className="text-gray-400">カテゴリがありません</p>
        ) : (
          <div className="space-y-2">
            {categories.map((category: any) => (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-md border border-gray-700 bg-gray-800 p-3 shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="h-6 w-6 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-white">{category.name}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="rounded-md bg-blue-900/50 px-3 py-1 text-sm text-blue-300 hover:bg-blue-800"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="rounded-md bg-red-900/50 px-3 py-1 text-sm text-red-300 hover:bg-red-800"
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
