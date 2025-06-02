import { z } from 'zod';
import { router, protectedProcedure } from '../index';
import {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  updateManyTodosStatus,
  deleteCompletedTodos,
  todoSchema,
  updateTodoOrderAndStatus
} from './actions';
import { TodoStatus } from '@prisma/client';

export const todoRouter = router({
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      if (!userId) {
        throw new Error('ユーザーIDが取得できませんでした');
      }
      return await getTodos({ userId });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      if (!userId) {
        throw new Error('ユーザーIDが取得できませんでした');
      }
      return await getTodoById(input.id, userId);
    }),

  create: protectedProcedure
    .input(todoSchema.omit({ id: true, createdAt: true, updatedAt: true, userId: true, order: true, completed: true }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      if (!userId) {
        throw new Error('ユーザーIDが取得できませんでした');
      }
      return await createTodo({ 
        ...input, 
        userId, 
        completed: false, 
        order: 0 
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: todoSchema.partial().omit({ id: true, createdAt: true, updatedAt: true, userId: true, order: true, completed: true })
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      if (!userId) {
        throw new Error('ユーザーIDが取得できませんでした');
      }
      return await updateTodo(input.id, input.data, userId);
    }),

  updateOrderAndStatus: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      newStatus: z.nativeEnum(TodoStatus),
      prevOrder: z.number().nullable(),
      nextOrder: z.number().nullable(),
      newParentId: z.string().nullable().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      if (!userId) {
        throw new Error('ユーザーIDが取得できませんでした');
      }
      return await updateTodoOrderAndStatus(
        input.taskId,
        userId,
        input.newStatus,
        input.prevOrder,
        input.nextOrder,
        input.newParentId
      );
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      if (!userId) {
        throw new Error('ユーザーIDが取得できませんでした');
      }
      return await deleteTodo(input.id, userId);
    }),

  deleteCompleted: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      if (!userId) {
        throw new Error('ユーザーIDが取得できませんでした');
      }
      return await deleteCompletedTodos({ userId });
    }),

  updateManyStatus: protectedProcedure
    .input(z.object({
      ids: z.array(z.string()),
      status: z.nativeEnum(TodoStatus),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      if (!userId) {
        throw new Error('ユーザーIDが取得できませんでした');
      }
      return await updateManyTodosStatus(input.ids, input.status, userId);
    }),
});
