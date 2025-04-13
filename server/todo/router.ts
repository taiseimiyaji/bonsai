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
      return await getTodos({ userId: ctx.session.user.id });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return await getTodoById(input.id, ctx.session.user.id);
    }),

  create: protectedProcedure
    .input(todoSchema.omit({ id: true, createdAt: true, updatedAt: true, userId: true, order: true, completed: true }))
    .mutation(async ({ input, ctx }) => {
      return await createTodo({ ...input, userId: ctx.session.user.id });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: todoSchema.partial().omit({ id: true, createdAt: true, updatedAt: true, userId: true, order: true, completed: true })
    }))
    .mutation(async ({ input, ctx }) => {
      return await updateTodo(input.id, input.data, ctx.session.user.id);
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
      return await updateTodoOrderAndStatus(
        input.taskId,
        ctx.session.user.id,
        input.newStatus,
        input.prevOrder,
        input.nextOrder,
        input.newParentId
      );
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await deleteTodo(input.id, ctx.session.user.id);
    }),

  deleteCompleted: protectedProcedure
    .mutation(async ({ ctx }) => {
      return await deleteCompletedTodos({ userId: ctx.session.user.id });
    }),

  updateManyStatus: protectedProcedure
    .input(z.object({
      ids: z.array(z.string()),
      status: z.nativeEnum(TodoStatus),
    }))
    .mutation(async ({ input, ctx }) => {
      return await updateManyTodosStatus(input.ids, input.status, ctx.session.user.id);
    }),
});
