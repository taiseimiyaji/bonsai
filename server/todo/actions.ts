import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Prismaクライアントのインスタンス
const prisma = new PrismaClient();

// Todo項目の型定義
export const todoSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, { message: 'タイトルは必須です' }),
  completed: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Todo = z.infer<typeof todoSchema>;

// Todo一覧を取得するアクション
export async function getTodos() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { todos };
  } catch (error) {
    console.error('Todoの取得に失敗しました:', error);
    throw new Error('Todoの取得に失敗しました');
  }
}

// 単一のTodoを取得するアクション
export async function getTodoById(id: string) {
  try {
    const todo = await prisma.todo.findUnique({
      where: { id },
    });
    
    if (!todo) {
      throw new Error('Todoが見つかりませんでした');
    }
    
    return { todo };
  } catch (error) {
    console.error(`ID: ${id} のTodoの取得に失敗しました:`, error);
    throw new Error('Todoの取得に失敗しました');
  }
}

// 新しいTodoを作成するアクション
export async function createTodo(data: z.infer<typeof todoSchema>) {
  try {
    const todo = await prisma.todo.create({
      data: {
        title: data.title,
        completed: data.completed || false,
      },
    });
    return { todo };
  } catch (error) {
    console.error('Todoの作成に失敗しました:', error);
    throw new Error('Todoの作成に失敗しました');
  }
}

// Todoを更新するアクション
export async function updateTodo(id: string, data: Partial<z.infer<typeof todoSchema>>) {
  try {
    const todo = await prisma.todo.update({
      where: { id },
      data,
    });
    return { todo };
  } catch (error) {
    console.error(`ID: ${id} のTodoの更新に失敗しました:`, error);
    throw new Error('Todoの更新に失敗しました');
  }
}

// Todoを削除するアクション
export async function deleteTodo(id: string) {
  try {
    await prisma.todo.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error(`ID: ${id} のTodoの削除に失敗しました:`, error);
    throw new Error('Todoの削除に失敗しました');
  }
}

// 複数のTodoを一括で完了/未完了に更新するアクション
export async function updateManyTodosStatus(ids: string[], completed: boolean) {
  try {
    await prisma.todo.updateMany({
      where: {
        id: { in: ids },
      },
      data: { completed },
    });
    return { success: true };
  } catch (error) {
    console.error('複数Todoのステータス更新に失敗しました:', error);
    throw new Error('複数Todoのステータス更新に失敗しました');
  }
}

// 完了済みのTodoをすべて削除するアクション
export async function deleteCompletedTodos() {
  try {
    await prisma.todo.deleteMany({
      where: { completed: true },
    });
    return { success: true };
  } catch (error) {
    console.error('完了済みTodoの削除に失敗しました:', error);
    throw new Error('完了済みTodoの削除に失敗しました');
  }
}
