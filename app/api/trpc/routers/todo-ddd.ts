import { z } from 'zod';
import { protectedProcedure, router } from '../init';
import { TodoContainer } from '../todo/infrastructure/container';
import { prisma } from '@/prisma/prisma';
import {
  createTodoDto,
  updateTodoDto,
  todoSearchDto,
  todoSortDto,
  updateTodoOrderDto,
  updateManyTodosDto,
  createTodoCategoryDto,
  updateTodoCategoryDto,
} from '../todo/application/dtos';

// DIコンテナの取得（共有Prismaインスタンスを使用）
const container = TodoContainer.getInstance(prisma);

/**
 * TodoルーターのDDD実装
 */
export const todoDddRouter = router({
  // 全てのTodoを取得（フィルタリング・ソート機能付き）
  getAll: protectedProcedure
    .input(z.object({
      filters: todoSearchDto.optional(),
      sort: todoSortDto.optional()
    }).optional())
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      const todos = await container.getTodosUseCase.execute(
        userId,
        input?.filters,
        input?.sort
      );
      
      return { todos };
    }),
  
  // IDによる単一Todo取得
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      const todo = await container.getTodoByIdUseCase.execute(
        input.id,
        userId
      );
      
      return { todo };
    }),
  
  // 新しいTodoを作成
  create: protectedProcedure
    .input(createTodoDto)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      const todo = await container.createTodoUseCase.execute(
        input,
        userId
      );
      
      return { todo };
    }),
  
  // 既存のTodoを更新
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: updateTodoDto
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      const todo = await container.updateTodoUseCase.execute(
        input.id,
        input.data,
        userId
      );
      
      return { todo };
    }),
  
  // Todoを削除
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      await container.deleteTodoUseCase.execute(
        input.id,
        userId
      );
      
      return { success: true };
    }),
  
  // タスクの順序を更新
  updateOrder: protectedProcedure
    .input(updateTodoOrderDto)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      const todo = await container.updateTodoOrderUseCase.execute(
        input,
        userId
      );
      
      return { todo };
    }),
  
  // 複数のTodoのステータスを一括更新
  updateManyStatus: protectedProcedure
    .input(updateManyTodosDto)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      await container.updateManyTodosStatusUseCase.execute(
        input,
        userId
      );
      
      return { success: true };
    }),
  
  // 完了済みのTodoをすべて削除
  deleteCompleted: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user.id!;
      
      await container.deleteCompletedTodosUseCase.execute(userId);
      
      return { success: true };
    }),

  // 完了済みのTodoをアーカイブ
  archiveCompleted: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user.id!;
      
      const result = await container.archiveCompletedTodosUseCase.execute(userId);
      
      return { success: true, count: result.count };
    }),

  // 単一のTodoをアーカイブ
  archive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      const todo = await container.archiveTodoUseCase.execute(
        input.id,
        userId
      );
      
      return { todo };
    }),

  // アーカイブされたTodoを復元
  unarchive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      const todo = await container.unarchiveTodoUseCase.execute(
        input.id,
        userId
      );
      
      return { todo };
    }),

  // アーカイブされたTodoを取得
  getArchived: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id!;
      
      const todos = await container.getArchivedTodosUseCase.execute(userId);
      
      return { todos };
    }),
    
  // カテゴリ関連のエンドポイント
  
  // カテゴリ一覧を取得
  getCategories: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id!;
      
      const categories = await container.getTodoCategoriesUseCase.execute(userId);
      
      return { categories };
    }),
    
  // カテゴリを作成
  createCategory: protectedProcedure
    .input(createTodoCategoryDto)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      const category = await container.createTodoCategoryUseCase.execute(
        input,
        userId
      );
      
      return { category };
    }),
    
  // カテゴリを更新
  updateCategory: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: updateTodoCategoryDto
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      const category = await container.updateTodoCategoryUseCase.execute(
        input.id,
        input.data,
        userId
      );
      
      return { category };
    }),
    
  // カテゴリを削除
  deleteCategory: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      
      await container.deleteTodoCategoryUseCase.execute(
        input.id,
        userId
      );
      
      return { success: true };
    })
});