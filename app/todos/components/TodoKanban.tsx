"use client";

import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { TodoStatus } from "@prisma/client";

type TodoKanbanProps = {
  todos: any[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (todo: any) => void;
  onStatusChange: (id: string, status: TodoStatus, index?: number) => void;
  onAddTask?: (status: TodoStatus) => void;
  onOrderChange?: (taskId: string, newOrder: number, newParentId?: string | null) => void; 
};

// 列のタイトルとアイコンを定義（コンポーネント外に移動してメモリ効率化）
const columnConfig = {
  TODO: {
    title: "未着手",
    icon: (
      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    color: "border-t-4 border-t-gray-500",
  },
  IN_PROGRESS: {
    title: "進行中",
    icon: (
      <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: "border-t-4 border-t-blue-500",
  },
  DONE: {
    title: "完了",
    icon: (
      <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    color: "border-t-4 border-t-green-500",
  },
};

// 期限日の表示スタイルを定義する関数（メモ化のために外部に移動）
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

// TodoItemを簡略化したカンバン用のコンポーネント（メモ化）
const KanbanCard = memo(({ todo, index, onToggleComplete, onEdit, onDelete }: { 
  todo: any; 
  index: number;
  onToggleComplete: (id: string, completed: boolean) => void;
  onEdit: (todo: any) => void;
  onDelete: (id: string) => void;
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // イベントハンドラをメモ化
  const handleToggleComplete = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onToggleComplete(todo.id, e.target.checked);
  }, [todo.id, onToggleComplete]);
  
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(todo);
  }, [todo, onEdit]);
  
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(todo.id);
  }, [todo.id, onDelete]);
  
  const toggleDetails = useCallback(() => {
    setShowDetails(prev => !prev);
  }, []);
  
  return (
    <Draggable draggableId={todo.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-2 rounded-md border-l-4 ${
            todo.priority === "HIGH" ? "border-l-red-500" : 
            todo.priority === "MEDIUM" ? "border-l-yellow-500" : 
            todo.priority === "LOW" ? "border-l-blue-500" : "border-l-gray-600"
          } ${snapshot.isDragging ? "shadow-xl" : "shadow-md"} bg-gray-800 hover:bg-gray-750 transition-all duration-150`}
          onClick={toggleDetails}
        >
          <div className="p-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={handleToggleComplete}
                className="mr-3 h-5 w-5 rounded border-gray-600 bg-gray-700 text-blue-600"
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
                  
                  {todo.category && (
                    <span
                      className="ml-2 rounded-full px-2 py-0.5 text-xs text-white"
                      style={{ backgroundColor: todo.category.color + "80" }}
                    >
                      {todo.category.name}
                    </span>
                  )}
                </div>
                
                {showDetails && todo.description && (
                  <p className="mt-1 text-sm text-gray-400">{todo.description}</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {todo.dueDate && (
                  <span className={`text-xs ${getDueDateStyle(todo.dueDate)}`}>
                    {new Date(todo.dueDate).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}
                  </span>
                )}
                <button
                  onClick={handleEdit}
                  className="rounded-full bg-gray-700 p-1 text-gray-300 hover:bg-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {showDetails && (
              <div className="mt-2 flex justify-end space-x-2">
                <button
                  onClick={handleDelete}
                  className="rounded-md bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                >
                  削除
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
});

// コンポーネント名を設定（デバッグ用）
KanbanCard.displayName = 'KanbanCard';

// ドロップエリアをメモ化
const KanbanColumn = memo(({ 
  status, 
  todos, 
  columnConfig, 
  onAddTask,
  onToggleComplete,
  onEdit,
  onDelete
}: {
  status: TodoStatus;
  todos: any[];
  columnConfig: any;
  onAddTask: (status: TodoStatus) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  onEdit: (todo: any) => void;
  onDelete: (id: string) => void;
}) => {
  const handleAddTask = useCallback(() => {
    onAddTask(status);
  }, [status, onAddTask]);
  
  return (
    <div 
      key={status} 
      className={`rounded-lg bg-gray-800/90 ${columnConfig[status].color}`}
    >
      <div className="flex items-center justify-between border-b border-gray-700 p-3">
        <div className="flex items-center">
          {columnConfig[status].icon}
          <h3 className="ml-2 text-lg font-medium text-white">
            {columnConfig[status].title}
            <span className="ml-2 rounded-full bg-gray-700 px-2 py-0.5 text-sm text-gray-300">
              {todos.length}
            </span>
          </h3>
        </div>
        <button
          onClick={handleAddTask}
          className="rounded-full bg-gray-700 p-1 text-gray-300 hover:bg-gray-600 hover:text-white"
          title="新しいタスクを追加"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>
      <Droppable droppableId={status}>
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="min-h-[200px] p-2 space-y-2"
            style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}
          >
            {todos.length === 0 ? (
              <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-gray-600 p-4">
                <p className="text-center text-gray-400">タスクがありません</p>
              </div>
            ) : (
              todos.map((todo, index) => (
                <KanbanCard 
                  key={todo.id} 
                  todo={todo} 
                  index={index}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
});

// コンポーネント名を設定（デバッグ用）
KanbanColumn.displayName = 'KanbanColumn';

export default function TodoKanban({
  todos,
  onToggleComplete,
  onDelete,
  onEdit,
  onStatusChange,
  onAddTask,
  onOrderChange, 
}: TodoKanbanProps) {
  // ローカルでの状態管理
  const [localTodos, setLocalTodos] = useState<any[]>([]);
  
  // propsのtodosが変更されたらローカル状態を更新
  useEffect(() => {
    // ディープコピーを作成して参照の問題を回避
    setLocalTodos(JSON.parse(JSON.stringify(todos)));
  }, [todos]);

  // ステータスごとにタスクをグループ化（メモ化）
  const currentTodosByStatus = useMemo(() => ({
    TODO: localTodos.filter((todo) => todo.status === "TODO" && !todo.parentId)
      .sort((a, b) => a.order - b.order),
    IN_PROGRESS: localTodos.filter((todo) => todo.status === "IN_PROGRESS" && !todo.parentId)
      .sort((a, b) => a.order - b.order),
    DONE: localTodos.filter((todo) => todo.status === "DONE" && !todo.parentId)
      .sort((a, b) => a.order - b.order),
  }), [localTodos]);

  // ドラッグ&ドロップの処理（メモ化）
  const handleDragEnd = useCallback((result: any) => {
    const { destination, source, draggableId } = result;

    // ドロップ先がない場合は何もしない
    if (!destination) {
      return;
    }

    // 同じ列の同じ位置にドロップした場合は何もしない
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // ドラッグしたタスクのID
    const taskId = draggableId;
    
    // 新しいステータス
    const newStatus = destination.droppableId as TodoStatus;
    const sourceStatus = source.droppableId as TodoStatus;

    // 異なる列（ステータス）に移動した場合
    if (destination.droppableId !== source.droppableId) {
      // ステータス変更を親コンポーネントに通知（挿入位置のインデックスも渡す）
      onStatusChange(taskId, newStatus, destination.index);
    } 
    // 同じ列内での順序変更の場合
    else if (onOrderChange) {
      // 親コンポーネントに通知 (新しい順序インデックスを渡す)
      onOrderChange(taskId, destination.index);
    }
  }, [onStatusChange, onOrderChange]);

  // 新しいタスクを追加する処理（メモ化）
  const handleAddTask = useCallback((status: TodoStatus) => {
    if (onAddTask) {
      onAddTask(status);
    }
  }, [onAddTask]);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Object.entries(currentTodosByStatus).map(([status, statusTodos]) => (
          <KanbanColumn
            key={status}
            status={status as TodoStatus}
            todos={statusTodos}
            columnConfig={columnConfig}
            onAddTask={handleAddTask}
            onToggleComplete={onToggleComplete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
