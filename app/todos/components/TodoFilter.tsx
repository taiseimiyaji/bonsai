"use client";

import { TodoPriority, TodoStatus } from "@prisma/client";
import { useEffect, useState } from "react";
import { trpc } from "@/app/trpc-client";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ja from "date-fns/locale/ja";

// 日本語ロケールを登録
registerLocale("ja", ja);

type FilterState = {
  status?: TodoStatus;
  priority?: TodoPriority;
  categoryId?: string;
  dueDate?: {
    from?: Date;
    to?: Date;
  };
  search?: string;
  parentId?: string | null;
};

type SortState = {
  field: "dueDate" | "priority" | "createdAt" | "title" | "order";
  direction: "asc" | "desc";
};

type TodoFilterProps = {
  onFilterChange: (filters: FilterState) => void;
  onSortChange: (sort: SortState) => void;
  initialFilters?: FilterState;
  initialSort?: SortState;
};

export default function TodoFilter({
  onFilterChange,
  onSortChange,
  initialFilters = {},
  initialSort = { field: "order", direction: "asc" },
}: TodoFilterProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [sort, setSort] = useState<SortState>(initialSort);
  const [isExpanded, setIsExpanded] = useState(false);

  // カテゴリ一覧を取得
  const { data: categoriesData } = trpc.todo.getCategories.useQuery();
  const categories = categoriesData?.categories || [];

  // フィルターが変更されたら親コンポーネントに通知
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // ソートが変更されたら親コンポーネントに通知
  useEffect(() => {
    onSortChange(sort);
  }, [sort, onSortChange]);

  // フィルターをリセット
  const resetFilters = () => {
    setFilters({});
  };

  return (
    <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-md sm:mb-6 sm:p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-white sm:text-lg">フィルター・ソート</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="min-h-[44px] min-w-[44px] rounded-md px-3 py-2 text-base text-blue-400 hover:bg-gray-700 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:min-h-0 sm:min-w-0 sm:text-sm"
        >
          {isExpanded ? "閉じる" : "開く"}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-6 sm:space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* 検索キーワード */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label htmlFor="search" className="block text-base font-medium text-gray-200 sm:text-sm">
                キーワード検索
              </label>
              <input
                type="text"
                id="search"
                value={filters.search || ""}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value || undefined })
                }
                placeholder="タイトルまたは説明で検索"
                className="mt-2 block w-full min-h-[44px] rounded-md border border-gray-600 bg-gray-700 px-3 py-3 text-base text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:mt-1 sm:px-2 sm:py-2 sm:text-sm"
              />
            </div>

            {/* ステータスフィルター */}
            <div>
              <label htmlFor="status" className="block text-base font-medium text-gray-200 sm:text-sm">
                ステータス
              </label>
              <select
                id="status"
                value={filters.status || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    status: e.target.value ? (e.target.value as TodoStatus) : undefined,
                  })
                }
                className="mt-2 block w-full min-h-[44px] rounded-md border border-gray-600 bg-gray-700 px-3 py-3 text-base text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:mt-1 sm:px-2 sm:py-2 sm:text-sm"
              >
                <option value="">すべて</option>
                <option value="TODO">未着手</option>
                <option value="IN_PROGRESS">進行中</option>
                <option value="DONE">完了</option>
              </select>
            </div>

            {/* 優先度フィルター */}
            <div>
              <label htmlFor="priority" className="block text-base font-medium text-gray-200 sm:text-sm">
                優先度
              </label>
              <select
                id="priority"
                value={filters.priority || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    priority: e.target.value ? (e.target.value as TodoPriority) : undefined,
                  })
                }
                className="mt-2 block w-full min-h-[44px] rounded-md border border-gray-600 bg-gray-700 px-3 py-3 text-base text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:mt-1 sm:px-2 sm:py-2 sm:text-sm"
              >
                <option value="">すべて</option>
                <option value="HIGH">高</option>
                <option value="MEDIUM">中</option>
                <option value="LOW">低</option>
              </select>
            </div>

            {/* カテゴリフィルター */}
            <div>
              <label htmlFor="category" className="block text-base font-medium text-gray-200 sm:text-sm">
                カテゴリ
              </label>
              <select
                id="category"
                value={filters.categoryId || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    categoryId: e.target.value || undefined,
                  })
                }
                className="mt-2 block w-full min-h-[44px] rounded-md border border-gray-600 bg-gray-700 px-3 py-3 text-base text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:mt-1 sm:px-2 sm:py-2 sm:text-sm"
              >
                <option value="">すべて</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* 期限日フィルター */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-base font-medium text-gray-200 sm:text-sm">期限日</label>
              <div className="mt-2 flex flex-col space-y-3 sm:mt-1 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
                <DatePicker
                  selected={filters.dueDate?.from}
                  onChange={(date) =>
                    setFilters({
                      ...filters,
                      dueDate: {
                        ...filters.dueDate,
                        from: date || undefined,
                      },
                    })
                  }
                  locale="ja"
                  dateFormat="yyyy/MM/dd"
                  className="block w-full min-h-[44px] rounded-md border border-gray-600 bg-gray-700 px-3 py-3 text-base text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:px-2 sm:py-2 sm:text-sm"
                  placeholderText="開始日"
                  isClearable
                />
                <span className="text-center text-gray-400 sm:hidden">〜</span>
                <span className="hidden text-gray-400 sm:block">〜</span>
                <DatePicker
                  selected={filters.dueDate?.to}
                  onChange={(date) =>
                    setFilters({
                      ...filters,
                      dueDate: {
                        ...filters.dueDate,
                        to: date || undefined,
                      },
                    })
                  }
                  locale="ja"
                  dateFormat="yyyy/MM/dd"
                  className="block w-full min-h-[44px] rounded-md border border-gray-600 bg-gray-700 px-3 py-3 text-base text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:px-2 sm:py-2 sm:text-sm"
                  placeholderText="終了日"
                  isClearable
                />
              </div>
            </div>

            {/* 階層フィルター */}
            <div>
              <label htmlFor="hierarchy" className="block text-base font-medium text-gray-200 sm:text-sm">
                階層
              </label>
              <select
                id="hierarchy"
                value={filters.parentId === null ? "top" : filters.parentId === undefined ? "" : "sub"}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters({
                    ...filters,
                    parentId: value === "top" ? null : value === "sub" ? "any" : undefined,
                  });
                }}
                className="mt-2 block w-full min-h-[44px] rounded-md border border-gray-600 bg-gray-700 px-3 py-3 text-base text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:mt-1 sm:px-2 sm:py-2 sm:text-sm"
              >
                <option value="">すべて</option>
                <option value="top">最上位タスクのみ</option>
                <option value="sub">サブタスクのみ</option>
              </select>
            </div>

            {/* ソート */}
            <div>
              <label htmlFor="sortField" className="block text-base font-medium text-gray-200 sm:text-sm">
                並び替え
              </label>
              <div className="mt-2 flex flex-col space-y-3 sm:mt-1 sm:flex-row sm:space-x-2 sm:space-y-0">
                <select
                  id="sortField"
                  value={sort.field}
                  onChange={(e) =>
                    setSort({
                      ...sort,
                      field: e.target.value as SortState["field"],
                    })
                  }
                  className="block w-full min-h-[44px] rounded-md border border-gray-600 bg-gray-700 px-3 py-3 text-base text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:px-2 sm:py-2 sm:text-sm"
                >
                  <option value="order">表示順</option>
                  <option value="dueDate">期限日</option>
                  <option value="priority">優先度</option>
                  <option value="createdAt">作成日</option>
                  <option value="title">タイトル</option>
                </select>
                <select
                  value={sort.direction}
                  onChange={(e) =>
                    setSort({
                      ...sort,
                      direction: e.target.value as "asc" | "desc",
                    })
                  }
                  className="block w-full min-h-[44px] rounded-md border border-gray-600 bg-gray-700 px-3 py-3 text-base text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:px-2 sm:py-2 sm:text-sm"
                >
                  <option value="asc">昇順</option>
                  <option value="desc">降順</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-center sm:justify-end">
            <button
              onClick={resetFilters}
              className="min-h-[44px] w-full rounded-md bg-gray-700 px-4 py-3 text-base font-medium text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 sm:w-auto sm:text-sm"
            >
              フィルターをリセット
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
