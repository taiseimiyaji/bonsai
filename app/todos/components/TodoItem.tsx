"use client";

import { TodoPriority, TodoStatus } from "@prisma/client";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";

// 優先度に応じた色を定義
const priorityColors = {
  HIGH: "border-l-4 border-l-red-500",
  MEDIUM: "border-l-4 border-l-yellow-500",
  LOW: "border-l-4 border-l-blue-500",
};

// ステータスに応じた色を定義
const statusColors = {
  TODO: "bg-gray-700 text-gray-300",
  IN_PROGRESS: "bg-blue-700 text-blue-100",
  DONE: "bg-green-700 text-green-100",
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
  isKanban?: boolean;
};

export default function TodoItem({
  todo,
  index,
  onToggleComplete,
  onDelete,
  onEdit,
  showSubTasks = true,
  level = 0,
  isKanban = false,
}: TodoItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
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
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            marginLeft: isKanban ? 0 : `${level * 20}px`,
          }}
          className={`mb-2 rounded-md ${
            todo.priority ? priorityColors[todo.priority as TodoPriority] : "border-l-4 border-l-gray-600"
          } ${snapshot.isDragging ? "shadow-xl" : "shadow-md"} bg-gray-800 hover:bg-gray-750 transition-all duration-200 cursor-grab active:cursor-grabbing`}
          onClick={() => isKanban && setShowDetails(!showDetails)}
        >
          <div className="p-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleComplete(todo.id, e.target.checked);
                }}
                className="mr-3 h-5 w-5 rounded border-gray-600 bg-gray-700 text-blue-600 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
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
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                        statusColors[todo.status as TodoStatus]
                      }`}
                    >
                      {todo.status === "IN_PROGRESS" ? "進行中" : "完了"}
                    </span>
                  )}
                  
                  {todo.category && (
                    <span
                      className="ml-2 rounded-full px-2 py-0.5 text-xs text-white"
                      style={{ backgroundColor: todo.category.color + "80" }}
                    >
                      {todo.category.name}
                    </span>
                  )}
                </div>
                
                {(!isKanban || showDetails) && todo.description && (
                  <p className="mt-1 text-sm text-gray-400">{todo.description}</p>
                )}
                
                {(!isKanban || showDetails) && (
                  <div className="mt-2 flex flex-wrap items-center text-sm">
                    {todo.dueDate && (
                      <div className={`mr-4 flex items-center ${getDueDateStyle(todo.dueDate)}`}>
                        <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {format(new Date(todo.dueDate), "yyyy/MM/dd (EEE)", { locale: ja })}
                      </div>
                    )}
                    
                    {todo.priority && (
                      <div className="mr-4 flex items-center text-gray-300">
                        <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                        {todo.priority === "HIGH"
                          ? "高"
                          : todo.priority === "MEDIUM"
                          ? "中"
                          : "低"}
                      </div>
                    )}
                  </div>
                )}
                
                {(!isKanban || showDetails) && hasSubTasks && (
                  <div className="mt-2">
                    <div className="flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsExpanded(!isExpanded);
                        }}
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
              
              {(!isKanban || showDetails) && (
                <div className="flex">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(todo);
                    }}
                    className="mr-2 rounded-md bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 cursor-pointer"
                  >
                    編集
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(todo.id);
                    }}
                    className="rounded-md bg-red-600 px-3 py-1 text-white hover:bg-red-700 cursor-pointer"
                  >
                    削除
                  </button>
                </div>
              )}
              
              {isKanban && !showDetails && (
                <div className="flex items-center space-x-2">
                  {todo.dueDate && (
                    <span className={`text-xs ${getDueDateStyle(todo.dueDate)}`}>
                      {format(new Date(todo.dueDate), "MM/dd", { locale: ja })}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(todo);
                    }}
                    className="rounded-full bg-gray-700 p-1 text-gray-300 hover:bg-gray-600 cursor-pointer"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {(!isKanban || showDetails) && hasSubTasks && isExpanded && showSubTasks && (
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
                  isKanban={isKanban}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
