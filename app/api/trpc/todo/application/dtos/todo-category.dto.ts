import { z } from 'zod';

/**
 * TodoCategory関連のDTO定義
 */

// カテゴリ作成用DTO
export const createTodoCategoryDto = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'カラーコードは有効な16進数形式である必要があります',
  }).default('#3B82F6'),
});
export type CreateTodoCategoryDto = z.infer<typeof createTodoCategoryDto>;

// カテゴリ更新用DTO
export const updateTodoCategoryDto = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'カラーコードは有効な16進数形式である必要があります',
  }).optional(),
});
export type UpdateTodoCategoryDto = z.infer<typeof updateTodoCategoryDto>;