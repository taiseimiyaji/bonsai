import { z } from 'zod';

/**
 * Todo関連のDTO定義
 */

// 優先度の定義
export const todoPriorityDto = z.enum(['HIGH', 'MEDIUM', 'LOW']);
export type TodoPriorityDto = z.infer<typeof todoPriorityDto>;

// ステータスの定義
export const todoStatusDto = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);
export type TodoStatusDto = z.infer<typeof todoStatusDto>;

// Todo作成用DTO
export const createTodoDto = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  dueDate: z.date().optional().nullable(),
  priority: todoPriorityDto.default('MEDIUM'),
  status: todoStatusDto.default('TODO'),
  categoryId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
});
export type CreateTodoDto = z.infer<typeof createTodoDto>;

// Todo更新用DTO
export const updateTodoDto = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  completed: z.boolean().optional(),
  dueDate: z.date().optional().nullable(),
  priority: todoPriorityDto.optional(),
  status: todoStatusDto.optional(),
  categoryId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  order: z.number().optional(),
});
export type UpdateTodoDto = z.infer<typeof updateTodoDto>;

// Todo検索条件DTO
export const todoSearchDto = z.object({
  status: todoStatusDto.optional(),
  priority: todoPriorityDto.optional(),
  categoryId: z.string().optional(),
  dueDate: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }).optional(),
  search: z.string().optional(),
  parentId: z.string().nullable().optional(),
});
export type TodoSearchDto = z.infer<typeof todoSearchDto>;

// Todoソート条件DTO
export const todoSortDto = z.object({
  field: z.enum(['dueDate', 'priority', 'createdAt', 'title', 'order']),
  direction: z.enum(['asc', 'desc']),
});
export type TodoSortDto = z.infer<typeof todoSortDto>;

// Todo表示順序更新DTO
export const updateTodoOrderDto = z.object({
  taskId: z.string(),
  newOrder: z.number().int().min(0),
  newParentId: z.string().nullable().optional(),
});
export type UpdateTodoOrderDto = z.infer<typeof updateTodoOrderDto>;

// 複数Todo更新DTO
export const updateManyTodosDto = z.object({
  ids: z.array(z.string()).min(1),
  completed: z.boolean(),
});
export type UpdateManyTodosDto = z.infer<typeof updateManyTodosDto>;

// TodoレスポンスDTO
export interface TodoResponseDto {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  archived: boolean;
  userId: string;
  dueDate: Date | null;
  priority: TodoPriorityDto;
  status: TodoStatusDto;
  order: number;
  categoryId: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  category?: TodoCategoryResponseDto | null;
  subTasks?: TodoResponseDto[];
  parent?: TodoResponseDto | null;
}

// TodoカテゴリレスポンスDTO
export interface TodoCategoryResponseDto {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}