"use client";

import { useState } from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import TodoItem from "./TodoItem";
import { trpc } from "@/app/trpc-client";
import { toast } from "react-hot-toast";
import { useOptimisticTodos } from "../hooks/useOptimisticTodos";

type TodoListProps = {
  todos: any[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (todo: any) => void;
  onOrderChange: (taskId: string, newOrder: number, newParentId?: string | null) => void;
};

export default function TodoList({
  todos,
  onToggleComplete,
  onDelete,
  onEdit,
  onOrderChange,
}: TodoListProps) {
  // 楽観的更新フックを使用
  const { optimisticUpdateOrder, optimisticToggleComplete, optimisticDelete } = useOptimisticTodos();
  
  // トップレベルのタスクのみをフィルタリング
  const topLevelTodos = todos.filter((todo) => !todo.parentId);

  // ドラッグ&ドロップの処理
  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    // ドロップ先がない場合や、同じ位置にドロップした場合は何もしない
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    // ドラッグしたタスクのID
    const taskId = draggableId;
    
    // 新しい順序を計算（1024刻みで順序を設定）
    const newOrder = destination.index * 1024;
    
    // 楽観的更新を使用して即座にUIを更新
    optimisticUpdateOrder(taskId, newOrder);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="todo-list">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-2 sm:space-y-3"
          >
            {topLevelTodos.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-base text-gray-400 sm:text-sm">タスクがありません</p>
              </div>
            ) : (
              topLevelTodos.map((todo, index) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  index={index}
                  onToggleComplete={optimisticToggleComplete}
                  onDelete={optimisticDelete}
                  onEdit={onEdit}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
