"use client";

import { TodoPriority, TodoStatus } from "@prisma/client";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";

// 優先度に応じた色を定義
const priorityColors = {
  HIGH: "bg-red-900/30 border-red-700/50 dark:bg-red-900/30 dark:border-red-700/50",
  MEDIUM: "bg-yellow-900/30 border-yellow-700/50 dark:bg-yellow-900/30 dark:border-yellow-700/50",
  LOW: "bg-blue-900/30 border-blue-700/50 dark:bg-blue-900/30 dark:border-blue-700/50",
};

// ステータスに応じた色を定義
const statusColors = {
  TODO: "bg-gray-800 text-gray-300",
  IN_PROGRESS: "bg-blue-900/50 text-blue-300",
  DONE: "bg-green-900/50 text-green-300",
};

// 期限日の表示スタイルを定義
const getDueDateStyle = (dueDate: Date | null) => {
  if (!dueDate) return "";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dueDateObj = new Date(dueDate);
  dueDateObj.setHours(0, 0, 0, 0);
  
  if (dueDateObj < today) {
    return "text-red-400 font-bold"; // 期限切れ
  } else if (dueDateObj.getTime() === today.getTime()) {
    return "text-orange-400 font-bold"; // 今日が期限
  } else if (dueDateObj.getTime() === tomorrow.getTime()) {
    return "text-yellow-400"; // 明日が期限
  }
  return "text-gray-400"; // その他
};

type TodoItemProps = {
  todo: any;
  index: number;
  onToggleComplete: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (todo: any) => void;
  showSubTasks?: boolean;
  level?: number;
};

export default function TodoItem({
  todo,
  index,
  onToggleComplete,
  onDelete,
  onEdit,
  showSubTasks = true,
  level = 0,
}: TodoItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasSubTasks = todo.subTasks && todo.subTasks.length > 0;
  
  // サブタスクの完了率を計算
  const calculateProgress = () => {
    if (!hasSubTasks) return 0;
    const completedCount = todo.subTasks.filter((st: any) => st.completed).length;
    return Math.round((completedCount / todo.subTasks.length) * 100);
  };
  
  const progress = calculateProgress();
  
  return (
    <Draggable draggableId={todo.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            ...provided.draggableProps.style,
            marginLeft: `${level * 20}px`,
          }}
          className={`mb-2 rounded-md border ${
            todo.priority ? priorityColors[todo.priority as TodoPriority] : "border-gray-700"
          } ${snapshot.isDragging ? "shadow-lg" : ""} bg-gray-800`}
        >
          <div className="p-3">
            <div className="flex items-center">
              <div {...provided.dragHandleProps} className="mr-2 cursor-grab text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="8" cy="6" r="1" />
                  <circle cx="8" cy="12" r="1" />
                  <circle cx="8" cy="18" r="1" />
                  <circle cx="16" cy="6" r="1" />
                  <circle cx="16" cy="12" r="1" />
                  <circle cx="16" cy="18" r="1" />
                </svg>
              </div>
              
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={(e) => onToggleComplete(todo.id, e.target.checked)}
                className="mr-3 h-5 w-5 rounded border-gray-600 bg-gray-700 text-blue-600"
              />
              
              <div className="flex-1">
                <div className="flex items-center">
                  <span
                    className={`text-lg ${
                      todo.completed ? "line-through text-gray-500" : "text-white"
                    }`}
                  >
                    {todo.title}
                  </span>
                  
                  {todo.status && todo.status !== "TODO" && (
                    <span
                      className={`ml-2 rounded-full px-2 py-1 text-xs ${
                        statusColors[todo.status as TodoStatus]
                      }`}
                    >
                      {todo.status === "IN_PROGRESS" ? "進行中" : "完了"}
                    </span>
                  )}
                  
                  {todo.category && (
                    <span
                      className="ml-2 rounded-full px-2 py-1 text-xs text-white"
                      style={{ backgroundColor: todo.category.color + "60" }}
                    >
                      {todo.category.name}
                    </span>
                  )}
                </div>
                
                {todo.description && (
                  <p className="mt-1 text-sm text-gray-400">{todo.description}</p>
                )}
                
                <div className="mt-2 flex flex-wrap items-center text-sm">
                  {todo.dueDate && (
                    <span className={`mr-4 ${getDueDateStyle(todo.dueDate)}`}>
                      期限: {format(new Date(todo.dueDate), "yyyy/MM/dd (EEE)", { locale: ja })}
                    </span>
                  )}
                  
                  {todo.priority && (
                    <span className="mr-4 text-gray-300">
                      優先度:{" "}
                      {todo.priority === "HIGH"
                        ? "高"
                        : todo.priority === "MEDIUM"
                        ? "中"
                        : "低"}
                    </span>
                  )}
                </div>
                
                {hasSubTasks && (
                  <div className="mt-2">
                    <div className="flex items-center">
                      <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="mr-2 text-gray-400 hover:text-gray-200"
                      >
                        {isExpanded ? "▼" : "▶"}
                      </button>
                      <span className="text-sm text-gray-400">
                        サブタスク ({todo.subTasks.filter((st: any) => st.completed).length}/{todo.subTasks.length})
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-gray-700">
                      <div
                        className="h-2 rounded-full bg-green-600"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex">
                <button
                  onClick={() => onEdit(todo)}
                  className="mr-2 rounded-md bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                >
                  編集
                </button>
                <button
                  onClick={() => onDelete(todo.id)}
                  className="rounded-md bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
          
          {hasSubTasks && isExpanded && showSubTasks && (
            <div className="border-t border-gray-700 pl-4">
              {todo.subTasks.map((subTask: any, subIndex: number) => (
                <TodoItem
                  key={subTask.id}
                  todo={subTask}
                  index={subIndex}
                  onToggleComplete={onToggleComplete}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
