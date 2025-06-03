"use client";

import { useState, useCallback, memo, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { TodoStatus } from "@prisma/client";

type TodoKanbanProps = {
  todos: any[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (todo: any) => void;
  onArchive: (id: string) => void;
  onStatusChange?: (id: string, status: TodoStatus, destinationIndex: number) => void;
  onAddTask?: (status: TodoStatus) => void;
  onOrderChange?: (taskId: string, newOrder: number, newParentId?: string | null) => void; 
};

// 列のタイトルとアイコンを定義（Trello風デザイン）
const columnConfig = {
  TODO: {
    title: "To Do",
    icon: (
      <svg className="h-4 w-4 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    bgColor: "bg-slate-100 dark:bg-slate-700",
    textColor: "text-slate-800 dark:text-slate-200",
  },
  IN_PROGRESS: {
    title: "In Progress",
    icon: (
      <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    bgColor: "bg-blue-100 dark:bg-blue-800",
    textColor: "text-blue-800 dark:text-blue-200",
  },
  DONE: {
    title: "Done",
    icon: (
      <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    bgColor: "bg-green-100 dark:bg-green-800",
    textColor: "text-green-800 dark:text-green-200",
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

// Trello風カンバンカードコンポーネント（メモ化）
const KanbanCard = memo(({ todo, index, onToggleComplete, onEdit, onDelete, onArchive }: { 
  todo: any; 
  index: number;
  onToggleComplete: (id: string, completed: boolean) => void;
  onEdit: (todo: any) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}) => {
  const [showActions, setShowActions] = useState(false);
  
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

  const handleArchive = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive(todo.id);
  }, [todo.id, onArchive]);
  
  const toggleActions = useCallback(() => {
    setShowActions(prev => !prev);
  }, []);
  
  return (
    <Draggable draggableId={todo.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 ${
            snapshot.isDragging ? "shadow-lg rotate-2" : "hover:shadow-md dark:hover:shadow-lg"
          } transition-all duration-200 cursor-pointer group`}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={handleToggleComplete}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
                
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-medium ${
                    todo.completed ? "line-through text-gray-500" : "text-gray-900 dark:text-gray-100"
                  } break-words leading-5`}>
                    {todo.title}
                  </h3>
                  
                  {todo.description && (
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 break-words overflow-hidden" 
                       style={{ 
                         display: '-webkit-box',
                         WebkitLineClamp: 2,
                         WebkitBoxOrient: 'vertical' 
                       }}>
                      {todo.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2">
                      {todo.category && (
                        <span
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: todo.category.color + "20",
                            color: todo.category.color
                          }}
                        >
                          {todo.category.name}
                        </span>
                      )}
                      
                      {todo.priority !== "MEDIUM" && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          todo.priority === "HIGH" 
                            ? "bg-red-100 text-red-800" 
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {todo.priority === "HIGH" ? "高" : "低"}
                        </span>
                      )}
                    </div>
                    
                    {todo.dueDate && (
                      <span className={`text-xs font-medium ${getDueDateStyle(todo.dueDate)}`}>
                        {new Date(todo.dueDate).toLocaleDateString('ja-JP', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className={`flex space-x-1 transition-opacity duration-200 ${
                showActions ? "opacity-100" : "opacity-0"
              }`}>
                <button
                  onClick={handleEdit}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  title="編集"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                
                {todo.completed && (
                  <button
                    onClick={handleArchive}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    title="アーカイブ"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6 6-6" />
                    </svg>
                  </button>
                )}
                
                <button
                  onClick={handleDelete}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="削除"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
});

// コンポーネント名を設定（デバッグ用）
KanbanCard.displayName = 'KanbanCard';

// Trello風ドロップエリアをメモ化
const KanbanColumn = memo(({ 
  status, 
  title,
  icon,
  bgColor,
  textColor,
  todos, 
  onAddTask,
  onToggleComplete,
  onEdit,
  onDelete,
  onArchive
}: {
  status: TodoStatus;
  title: string;
  icon: React.ReactElement;
  bgColor: string;
  textColor: string;
  todos: any[];
  onAddTask: (status: TodoStatus) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  onEdit: (todo: any) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}) => {
  const handleAddTask = useCallback(() => {
    onAddTask(status);
  }, [status, onAddTask]);
  
  return (
    <div className="flex flex-col h-full">
      <div className={`rounded-t-lg ${bgColor} p-3 border-b border-gray-200 dark:border-gray-600`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <h3 className={`text-sm font-semibold ${textColor}`}>
              {title}
            </h3>
            <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium px-2 py-1 rounded-full">
              {todos.length}
            </span>
          </div>
          <button
            onClick={handleAddTask}
            className="p-1 rounded hover:bg-white/20 dark:hover:bg-black/20 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
            title="新しいタスクを追加"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>
      
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`flex-1 p-3 rounded-b-lg bg-gray-50 dark:bg-gray-800 min-h-[400px] ${
              snapshot.isDraggingOver ? "bg-blue-50 dark:bg-blue-900/30" : ""
            } transition-colors duration-200`}
          >
            {todos.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {status === 'TODO' ? 'タスクを追加' : 
                   status === 'IN_PROGRESS' ? '作業中のタスクなし' : 
                   '完了したタスクなし'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {todos.map((todo, index) => (
                  <KanbanCard 
                    key={todo.id} 
                    todo={todo} 
                    index={index}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onArchive={onArchive}
                  />
                ))}
              </div>
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
  onArchive,
  onStatusChange,
  onAddTask,
  onOrderChange, 
}: TodoKanbanProps) {
  // ステータスごとのTodoをメモ化
  const todosByStatus = useMemo(() => {
    return todos.reduce((acc, todo) => {
      if (!acc[todo.status]) {
        acc[todo.status] = [];
      }
      acc[todo.status].push(todo);
      // orderでソート
      acc[todo.status].sort((a: any, b: any) => a.order - b.order);
      return acc;
    }, {} as Record<TodoStatus, typeof todos>);
  }, [todos]);

  const reorder = useCallback((list: any[], startIndex: number, endIndex: number) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  }, []);

  const calculateNewOrder = useCallback((beforeOrder: number | null, afterOrder: number | null): number => {
    if (beforeOrder === null && afterOrder === null) return 0;
    if (beforeOrder === null) return afterOrder! - 1024;
    if (afterOrder === null) return beforeOrder + 1024;
    return (beforeOrder + afterOrder) / 2;
  }, []);

  const handleDragEnd = useCallback((result: any) => {
    const { source, destination } = result;
    if (!destination) return;


    const sourceStatus = source.droppableId as TodoStatus;
    const destStatus = destination.droppableId as TodoStatus;
    
    const sourceList = [...(todosByStatus[sourceStatus] || [])];
    const destList = sourceStatus === destStatus ? sourceList : [...(todosByStatus[destStatus] || [])];

    if (sourceStatus === destStatus) {
      // 同じステータス内での並び替え
      const movedItem = sourceList[source.index];
      
      // 並び替え後のリストを作成
      const reorderedList = reorder(sourceList, source.index, destination.index);
      
      // 新しい位置での順序を計算
      let newOrder: number;
      if (destination.index === 0) {
        // 最初に移動
        const nextItem = reorderedList[1];
        newOrder = nextItem ? nextItem.order - 1024 : 0;
      } else if (destination.index >= reorderedList.length - 1) {
        // 最後に移動
        const prevItem = reorderedList[reorderedList.length - 2];
        newOrder = prevItem ? prevItem.order + 1024 : 1024;
      } else {
        // 中間に移動
        const beforeItem = reorderedList[destination.index - 1];
        const afterItem = reorderedList[destination.index + 1];
        newOrder = (beforeItem.order + afterItem.order) / 2;
      }
      
      // 親コンポーネントに順序変更を通知
      if (onOrderChange) {
        onOrderChange(movedItem.id, newOrder);
      }
    } else {
      // 異なるステータス間の移動
      const [movedItem] = sourceList.splice(source.index, 1);
      destList.splice(destination.index, 0, movedItem);
      
      // 新しい順序を計算
      const beforeItem = destination.index > 0 ? destList[destination.index - 1] : null;
      const afterItem = destination.index < destList.length - 1 ? destList[destination.index + 1] : null;
      
      const newOrder = calculateNewOrder(
        beforeItem?.order ?? null,
        afterItem?.order ?? null
      );

      // 親コンポーネントにステータス変更を通知（順序も含む）
      if (onStatusChange) {
        onStatusChange(movedItem.id, destStatus, newOrder);
      }
    }
  }, [todosByStatus, reorder, calculateNewOrder, onOrderChange, onStatusChange]);

  const handleAddTask = useCallback((status: TodoStatus) => {
    if (onAddTask) {
      onAddTask(status);
    }
  }, [onAddTask]);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {Object.entries(columnConfig).map(([status, config]) => (
          <KanbanColumn
            key={status}
            status={status as TodoStatus}
            title={config.title}
            icon={config.icon}
            bgColor={config.bgColor}
            textColor={config.textColor}
            todos={todosByStatus[status as TodoStatus] || []}
            onToggleComplete={onToggleComplete}
            onDelete={onDelete}
            onEdit={onEdit}
            onArchive={onArchive}
            onAddTask={handleAddTask}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
