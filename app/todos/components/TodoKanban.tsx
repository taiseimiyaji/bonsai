"use client";

import { useState } from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import TodoItem from "./TodoItem";
import { trpc } from "@/app/trpc-client";
import { toast } from "react-hot-toast";
import { TodoStatus } from "@prisma/client";

type TodoKanbanProps = {
  todos: any[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (todo: any) => void;
  onStatusChange: (id: string, status: TodoStatus) => void;
};

export default function TodoKanban({
  todos,
  onToggleComplete,
  onDelete,
  onEdit,
  onStatusChange,
}: TodoKanbanProps) {
  // ステータスごとにタスクをグループ化
  const todosByStatus = {
    TODO: todos.filter((todo) => todo.status === "TODO" && !todo.parentId),
    IN_PROGRESS: todos.filter((todo) => todo.status === "IN_PROGRESS" && !todo.parentId),
    DONE: todos.filter((todo) => todo.status === "DONE" && !todo.parentId),
  };

  // ドラッグ&ドロップの処理
  const handleDragEnd = (result: any) => {
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
    
    // 異なる列（ステータス）に移動した場合
    if (destination.droppableId !== source.droppableId) {
      // ステータス変更を親コンポーネントに通知
      onStatusChange(taskId, newStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* 未着手 */}
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
          <h3 className="mb-3 text-lg font-medium text-white">未着手</h3>
          <Droppable droppableId="TODO">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="min-h-[200px] space-y-2"
              >
                {todosByStatus.TODO.length === 0 ? (
                  <p className="py-4 text-center text-gray-400">タスクがありません</p>
                ) : (
                  todosByStatus.TODO.map((todo, index) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      index={index}
                      onToggleComplete={onToggleComplete}
                      onDelete={onDelete}
                      onEdit={onEdit}
                      showSubTasks={false}
                    />
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* 進行中 */}
        <div className="rounded-lg border border-gray-700 bg-gray-800/90 p-4">
          <h3 className="mb-3 text-lg font-medium text-white">進行中</h3>
          <Droppable droppableId="IN_PROGRESS">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="min-h-[200px] space-y-2"
              >
                {todosByStatus.IN_PROGRESS.length === 0 ? (
                  <p className="py-4 text-center text-gray-400">タスクがありません</p>
                ) : (
                  todosByStatus.IN_PROGRESS.map((todo, index) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      index={index}
                      onToggleComplete={onToggleComplete}
                      onDelete={onDelete}
                      onEdit={onEdit}
                      showSubTasks={false}
                    />
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* 完了 */}
        <div className="rounded-lg border border-gray-700 bg-gray-800/80 p-4">
          <h3 className="mb-3 text-lg font-medium text-white">完了</h3>
          <Droppable droppableId="DONE">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="min-h-[200px] space-y-2"
              >
                {todosByStatus.DONE.length === 0 ? (
                  <p className="py-4 text-center text-gray-400">タスクがありません</p>
                ) : (
                  todosByStatus.DONE.map((todo, index) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      index={index}
                      onToggleComplete={onToggleComplete}
                      onDelete={onDelete}
                      onEdit={onEdit}
                      showSubTasks={false}
                    />
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    </DragDropContext>
  );
}
