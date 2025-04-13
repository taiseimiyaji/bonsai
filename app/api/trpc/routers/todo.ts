import { z } from 'zod';
import { publicProcedure, router } from '../init';
import {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  updateManyTodosStatus,
  deleteCompletedTodos,
  todoSchema,
  todoPrioritySchema,
  todoStatusSchema,
  updateTaskOrder,
  getTodoCategories,
  createTodoCategory,
  updateTodoCategory,
  deleteTodoCategory,
  todoCategorySchema
} from '../actions/todo';
import { TRPCError } from '@trpc/server';
import { TodoPriority, TodoStatus } from '@prisma/client';

// Todoルーターの定義
export const todoRouter = router({
  // 全てのTodoを取得（フィルタリング・ソート機能付き）
  getAll: publicProcedure
    .input(z.object({
      filters: z.object({
        status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
        priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
        categoryId: z.string().optional(),
        dueDate: z.object({
          from: z.date().optional(),
          to: z.date().optional()
        }).optional(),
        search: z.string().optional(),
        parentId: z.string().nullable().optional()
      }).optional(),
      sort: z.object({
        field: z.enum(['dueDate', 'priority', 'createdAt', 'title', 'order']),
        direction: z.enum(['asc', 'desc'])
      }).optional()
    }).optional())
    .query(async ({ input, ctx }) => {
      // セッションからユーザーIDを取得
      const userId = ctx.session?.userId || ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'ログインが必要です',
        });
      }
      
      return await getTodos(
        userId, 
        input?.filters as any, 
        input?.sort
      );
    }),
  
  // IDによる単一Todo取得
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.session?.userId || ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'ログインが必要です',
        });
      }
      
      return await getTodoById(input.id, userId);
    }),
  
  // 新しいTodoを作成
  create: publicProcedure
    .input(todoSchema.omit({ id: true, userId: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.userId || ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'ログインが必要です',
        });
      }
      
      // ユーザーIDを追加
      const todoData = {
        ...input,
        userId,
      };
      
      return await createTodo(todoData);
    }),
  
  // 既存のTodoを更新
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: todoSchema.partial().omit({ id: true, userId: true, createdAt: true, updatedAt: true })
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.userId || ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'ログインが必要です',
        });
      }
      
      return await updateTodo(input.id, userId, input.data);
    }),
  
  // Todoを削除
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.userId || ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'ログインが必要です',
        });
      }
      
      return await deleteTodo(input.id, userId);
    }),
  
  // タスクの順序を更新
  updateOrder: publicProcedure
    .input(z.object({
      taskId: z.string(),
      newOrder: z.number(),
      newParentId: z.string().nullable().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.userId || ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'ログインが必要です',
        });
      }
      
      return await updateTaskOrder(
        userId,
        input.taskId,
        input.newOrder,
        input.newParentId
      );
    }),
  
  // 複数のTodoのステータスを一括更新
  updateManyStatus: publicProcedure
    .input(z.object({
      ids: z.array(z.string()),
      completed: z.boolean()
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.userId || ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'ログインが必要です',
        });
      }
      
      return await updateManyTodosStatus(input.ids, userId, input.completed);
    }),
  
  // 完了済みのTodoをすべて削除
  deleteCompleted: publicProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.session?.userId || ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'ログインが必要です',
        });
      }
      
      return await deleteCompletedTodos(userId);
    }),
    
  // カテゴリ関連のエンドポイント
  
  // カテゴリ一覧を取得
  getCategories: publicProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session?.userId || ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'ログインが必要です',
        });
      }
      
      return await getTodoCategories(userId);
    }),
    
  // カテゴリを作成
  createCategory: publicProcedure
    .input(todoCategorySchema.omit({ id: true, userId: true }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.userId || ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'ログインが必要です',
        });
      }
      
      const categoryData = {
        ...input,
        userId,
      };
      
      return await createTodoCategory(categoryData);
    }),
    
  // カテゴリを更新
  updateCategory: publicProcedure
    .input(z.object({
      id: z.string(),
      data: todoCategorySchema.partial().omit({ id: true, userId: true })
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.userId || ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'ログインが必要です',
        });
      }
      
      return await updateTodoCategory(input.id, userId, input.data);
    }),
    
  // カテゴリを削除
  deleteCategory: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.userId || ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'ログインが必要です',
        });
      }
      
      return await deleteTodoCategory(input.id, userId);
    })
});
