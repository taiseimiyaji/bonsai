"use client";

import { TodoPriority, TodoStatus } from "@prisma/client";
import { useEffect, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ja from "date-fns/locale/ja";
import { trpc } from "@/app/trpc-client";
import { toast } from "react-hot-toast";

// 日本語ロケールを登録
registerLocale("ja", ja);

type TodoFormProps = {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  parentId?: string | null;
};

export default function TodoForm({
  initialData,
  onSubmit,
  onCancel,
  parentId = null,
}: TodoFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [dueDate, setDueDate] = useState<Date | null>(
    initialData?.dueDate ? new Date(initialData.dueDate) : null
  );
  const [priority, setPriority] = useState<TodoPriority>(
    initialData?.priority || "MEDIUM"
  );
  const [status, setStatus] = useState<TodoStatus>(
    initialData?.status || "TODO"
  );
  const [categoryId, setCategoryId] = useState<string | null>(
    initialData?.categoryId || null
  );
  const [isLoading, setIsLoading] = useState(false);

  // カテゴリ一覧を取得
  const { data: categoriesData } = trpc.todo.getCategories.useQuery();
  const categories = categoriesData?.categories || [];

  // 親タスク一覧を取得（サブタスク作成時に選択肢として表示）
  const { data: todosData } = trpc.todo.getAll.useQuery({
    filters: {
      parentId: null, // 最上位のタスクのみ取得
    },
  });
  const parentTasks = todosData?.todos || [];

  // 編集モードかどうか
  const isEditMode = !!initialData;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("タイトルを入力してください");
      return;
    }
    
    setIsLoading(true);
    
    // dueDateの処理を改善
    let processedDueDate = undefined;
    if (dueDate) {
      processedDueDate = dueDate instanceof Date ? dueDate : new Date(dueDate);
    }
    
    const data = {
      title,
      description: description || undefined,
      dueDate: processedDueDate,
      priority,
      status,
      categoryId: categoryId || undefined,
      parentId: parentId || undefined,
    };
    
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div>
        <label htmlFor="title" className="block text-base font-medium text-gray-200 sm:text-sm">
          タイトル <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-2 block w-full min-h-[44px] rounded-md border border-gray-600 bg-gray-700 px-3 py-3 text-base text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:mt-1 sm:px-2 sm:py-2 sm:text-sm"
          placeholder="タスクのタイトル"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-base font-medium text-gray-200 sm:text-sm">
          説明
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-2 block w-full min-h-[88px] rounded-md border border-gray-600 bg-gray-700 px-3 py-3 text-base text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:mt-1 sm:px-2 sm:py-2 sm:text-sm"
          placeholder="タスクの詳細説明"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="dueDate" className="block text-base font-medium text-gray-200 sm:text-sm">
            期限日
          </label>
          <DatePicker
            id="dueDate"
            selected={dueDate}
            onChange={(date) => setDueDate(date)}
            locale="ja"
            dateFormat="yyyy/MM/dd"
            className="mt-2 block w-full min-h-[44px] rounded-md border border-gray-600 bg-gray-700 px-3 py-3 text-base text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:mt-1 sm:px-2 sm:py-2 sm:text-sm"
            placeholderText="期限日を選択"
            isClearable
          />
        </div>

        <div>
          <label htmlFor="priority" className="block text-base font-medium text-gray-200 sm:text-sm">
            優先度
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TodoPriority)}
            className="mt-2 block w-full min-h-[44px] rounded-md border border-gray-600 bg-gray-700 px-3 py-3 text-base text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:mt-1 sm:px-2 sm:py-2 sm:text-sm"
          >
            <option value="HIGH">高</option>
            <option value="MEDIUM">中</option>
            <option value="LOW">低</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="status" className="block text-base font-medium text-gray-200 sm:text-sm">
            ステータス
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TodoStatus)}
            className="mt-2 block w-full min-h-[44px] rounded-md border border-gray-600 bg-gray-700 px-3 py-3 text-base text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:mt-1 sm:px-2 sm:py-2 sm:text-sm"
          >
            <option value="TODO">未着手</option>
            <option value="IN_PROGRESS">進行中</option>
            <option value="DONE">完了</option>
          </select>
        </div>

        <div>
          <label htmlFor="category" className="block text-base font-medium text-gray-200 sm:text-sm">
            カテゴリ
          </label>
          <select
            id="category"
            value={categoryId || ""}
            onChange={(e) => setCategoryId(e.target.value || null)}
            className="mt-2 block w-full min-h-[44px] rounded-md border border-gray-600 bg-gray-700 px-3 py-3 text-base text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:mt-1 sm:px-2 sm:py-2 sm:text-sm"
          >
            <option value="">カテゴリなし</option>
            {categories.map((category: any) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!isEditMode && !parentId && (
        <div>
          <label htmlFor="parentTask" className="block text-base font-medium text-gray-200 sm:text-sm">
            親タスク（オプション）
          </label>
          <select
            id="parentTask"
            value={parentId || ""}
            onChange={(e) => onSubmit({ ...initialData, parentId: e.target.value || null })}
            className="mt-2 block w-full min-h-[44px] rounded-md border border-gray-600 bg-gray-700 px-3 py-3 text-base text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:mt-1 sm:px-2 sm:py-2 sm:text-sm"
          >
            <option value="">親タスクなし（最上位タスク）</option>
            {parentTasks
              .filter((task: any) => task.id !== initialData?.id) // 自分自身は選択肢から除外
              .map((task: any) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
          </select>
        </div>
      )}

      <div className="flex flex-col space-y-3 pt-4 sm:flex-row sm:justify-end sm:space-x-3 sm:space-y-0">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] w-full rounded-md border border-gray-600 bg-gray-800 px-4 py-3 text-base font-medium text-gray-200 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:w-auto sm:text-sm"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="min-h-[44px] w-full rounded-md bg-blue-600 px-4 py-3 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:w-auto sm:text-sm"
        >
          {isLoading ? "保存中..." : isEditMode ? "更新" : "作成"}
        </button>
      </div>
    </form>
  );
}
