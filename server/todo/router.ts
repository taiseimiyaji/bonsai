import { z } from 'zod';
import { router, publicProcedure } from '../index';
import {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  updateManyTodosStatus,
  deleteCompletedTodos,
  todoSchema,
  updateTodoOrder
} from './actions';

// Todoルーターの定義
export const todoRouter = router({
  // 全てのTodoを取得
  getAll: publicProcedure
    .query(async () => {
      return await getTodos();
    }),
  
  // IDによる単一Todo取得
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await getTodoById(input.id);
    }),
  
  // 新しいTodoを作成
  create: publicProcedure
    .input(todoSchema.omit({ id: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ input }) => {
      return await createTodo(input);
    }),
  
  // 既存のTodoを更新
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: todoSchema.partial().omit({ id: true, createdAt: true, updatedAt: true })
    }))
    .mutation(async ({ input }) => {
      return await updateTodo(input.id, input.data);
    }),
  
  // Todoを削除
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteTodo(input.id);
    }),
  
  // 複数のTodoのステータスを一括更新
  updateManyStatus: publicProcedure
    .input(z.object({
      ids: z.array(z.string()),
      completed: z.boolean()
    }))
    .mutation(async ({ input }) => {
      return await updateManyTodosStatus(input.ids, input.completed);
    }),
  
  // 完了済みのTodoをすべて削除
  deleteCompleted: publicProcedure
    .mutation(async () => {
      return await deleteCompletedTodos();
    }),
    
  // Todoの順序を更新
  updateOrder: publicProcedure
    .input(z.object({
      taskId: z.string(),
      newOrder: z.number(),
      newParentId: z.string().nullable().optional()
    }))
    .mutation(async ({ input }) => {
      return await updateTodoOrder(input.taskId, input.newOrder, input.newParentId);
    })
});
