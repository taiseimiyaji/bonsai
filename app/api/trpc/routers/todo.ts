import { z } from 'zod';
import { protectedProcedure, router } from '../init';
import {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  updateManyTodosStatus,
  deleteCompletedTodos,
  archiveCompletedTodos,
  archiveTodo,
  unarchiveTodo,
  getArchivedTodos,
  todoSchema,
  updateTaskOrder,
  getTodoCategories,
  createTodoCategory,
  updateTodoCategory,
  deleteTodoCategory,
  todoCategorySchema
} from '../actions/todo';

// Todoルーターの定義
export const todoRouter = router({
  // 全てのTodoを取得（フィルタリング・ソート機能付き）
  getAll: protectedProcedure
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
      // protectedProcedureを使用しているため、ctx.session.userは必ず存在する
      const userId = ctx.session.user.id!;
      
      return await getTodos(
        userId, 
        input?.filters as any, 
        input?.sort
      );
    }),
  
  // IDによる単一Todo取得
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      return await getTodoById(input.id, userId);
    }),
  
  // 新しいTodoを作成
  create: protectedProcedure
    .input(todoSchema.omit({ id: true, userId: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      // ユーザーIDを追加
      const todoData = {
        ...input,
        userId,
      };
      
      return await createTodo(todoData);
    }),
  
  // 既存のTodoを更新
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: todoSchema.partial().omit({ id: true, userId: true, createdAt: true, updatedAt: true })
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      return await updateTodo(input.id, userId, input.data);
    }),
  
  // Todoを削除
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      return await deleteTodo(input.id, userId);
    }),
  
  // タスクの順序を更新
  updateOrder: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      newOrder: z.number(),
      newParentId: z.string().nullable().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      return await updateTaskOrder(
        userId,
        input.taskId,
        input.newOrder,
        input.newParentId
      );
    }),
  
  // 複数のTodoのステータスを一括更新
  updateManyStatus: protectedProcedure
    .input(z.object({
      ids: z.array(z.string()),
      completed: z.boolean()
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      return await updateManyTodosStatus(input.ids, userId, input.completed);
    }),
  
  // 完了済みのTodoをすべて削除
  deleteCompleted: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user.id!;
      
      return await deleteCompletedTodos(userId);
    }),

  // 完了済みのTodoをアーカイブ
  archiveCompleted: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user.id!;
      
      return await archiveCompletedTodos(userId);
    }),

  // 単一のTodoをアーカイブ
  archive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      return await archiveTodo(input.id, userId);
    }),

  // アーカイブされたTodoを復元
  unarchive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      return await unarchiveTodo(input.id, userId);
    }),

  // アーカイブされたTodoを取得
  getArchived: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id!;
      
      return await getArchivedTodos(userId);
    }),
    
  // カテゴリ関連のエンドポイント
  
  // カテゴリ一覧を取得
  getCategories: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id!;
      
      return await getTodoCategories(userId);
    }),
    
  // カテゴリを作成
  createCategory: protectedProcedure
    .input(todoCategorySchema.omit({ id: true, userId: true }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      const categoryData = {
        ...input,
        userId,
      };
      
      return await createTodoCategory(categoryData);
    }),
    
  // カテゴリを更新
  updateCategory: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: todoCategorySchema.partial().omit({ id: true, userId: true })
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      return await updateTodoCategory(input.id, userId, input.data);
    }),
    
  // カテゴリを削除
  deleteCategory: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      return await deleteTodoCategory(input.id, userId);
    })
});
