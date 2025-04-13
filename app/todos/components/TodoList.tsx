"use client";

import { useState } from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import TodoItem from "./TodoItem";
import { trpc } from "@/app/trpc-client";
import { toast } from "react-hot-toast";

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
    
    // 新しい順序
    const newOrder = destination.index;
    
    // 親タスクIDの変更（今回はトップレベルのみの実装なので親は変更しない）
    const newParentId = null;
    
    // 順序変更を親コンポーネントに通知
    onOrderChange(taskId, newOrder, newParentId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="todo-list">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-2"
          >
            {topLevelTodos.length === 0 ? (
              <p className="py-4 text-center text-gray-500">タスクがありません</p>
            ) : (
              topLevelTodos.map((todo, index) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  index={index}
                  onToggleComplete={onToggleComplete}
                  onDelete={onDelete}
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
