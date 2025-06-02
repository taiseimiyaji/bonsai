import { PrismaClient, TodoPriority, TodoStatus } from '@prisma/client';
import { z } from 'zod';

// Prismaクライアントのインスタンス
const prisma = new PrismaClient();

// 優先度のZodスキーマ
export const todoPrioritySchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);

// ステータスのZodスキーマ
export const todoStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);

// Todo項目の型定義
export const todoSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, { message: 'タイトルは必須です' }),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  userId: z.string(),
  dueDate: z.date().optional().nullable(),
  priority: todoPrioritySchema.default('MEDIUM'),
  status: todoStatusSchema.default('TODO'),
  order: z.number().default(0),
  categoryId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Todo = z.infer<typeof todoSchema>;

// Todo一覧を取得するアクション
export async function getTodos(filters?: { userId: string }) {
  try {
    const where: any = {};
    if (filters?.userId) {
      where.userId = filters.userId;
    }
    
    const todos = await prisma.todo.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        category: true,
        subTasks: {
          orderBy: { order: 'asc' },
        },
      },
    });
    return { todos };
  } catch (error) {
    console.error('Todoの取得に失敗しました:', error);
    throw new Error('Todoの取得に失敗しました');
  }
}

// 単一のTodoを取得するアクション
export async function getTodoById(id: string, userId: string) {
  try {
    const todo = await prisma.todo.findFirst({
      where: { 
        id,
        userId 
      },
      include: {
        category: true,
        subTasks: {
          orderBy: { order: 'asc' },
          include: {
            subTasks: true, // 2階層目のサブタスクも取得
          }
        },
        parent: true,
      }
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
    // 同じ親を持つタスクの最大orderを取得
    const maxOrderTask = await prisma.todo.findFirst({
      where: {
        userId: data.userId,
        parentId: data.parentId,
      },
      orderBy: {
        order: 'desc',
      },
    });
    
    const newOrder = maxOrderTask ? maxOrderTask.order + 1 : 0;
    
    const todo = await prisma.todo.create({
      data: {
        title: data.title,
        description: data.description,
        completed: data.completed || false,
        userId: data.userId,
        dueDate: data.dueDate,
        priority: data.priority as TodoPriority,
        status: data.status as TodoStatus,
        order: newOrder,
        categoryId: data.categoryId,
        parentId: data.parentId,
      },
      include: {
        category: true,
      },
    });
    return { todo };
  } catch (error) {
    console.error('Todoの作成に失敗しました:', error);
    throw new Error('Todoの作成に失敗しました');
  }
}

// Todoを更新するアクション
export async function updateTodo(id: string, data: Partial<z.infer<typeof todoSchema>>, userId: string) {
  try {
    // まず対象のTodoが存在し、ユーザーのものであることを確認
    const existingTodo = await prisma.todo.findFirst({
      where: { 
        id,
        userId 
      },
    });
    
    if (!existingTodo) {
      throw new Error('更新対象のTodoが見つかりませんでした');
    }
    
    // completedがtrueに変更された場合、statusもDONEに更新
    if (data.completed === true && existingTodo.status !== 'DONE') {
      data.status = 'DONE';
    }
    // completedがfalseに変更され、かつstatusがDONEだった場合、TODOに戻す
    else if (data.completed === false && existingTodo.status === 'DONE') {
      data.status = 'TODO';
    }
    
    const todo = await prisma.todo.update({
      where: { id },
      data,
      include: {
        category: true,
        subTasks: true,
      },
    });
    return { todo };
  } catch (error) {
    console.error(`ID: ${id} のTodoの更新に失敗しました:`, error);
    throw new Error('Todoの更新に失敗しました');
  }
}

// Todoを削除するアクション
export async function deleteTodo(id: string, userId: string) {
  try {
    // まず対象のTodoが存在し、ユーザーのものであることを確認
    const existingTodo = await prisma.todo.findFirst({
      where: { 
        id,
        userId 
      },
      include: {
        subTasks: true,
      },
    });
    
    if (!existingTodo) {
      throw new Error('削除対象のTodoが見つかりませんでした');
    }
    
    // サブタスクも含めて再帰的に削除
    await deleteTaskWithSubtasks(id);
    
    return { success: true };
  } catch (error) {
    console.error(`ID: ${id} のTodoの削除に失敗しました:`, error);
    throw new Error('Todoの削除に失敗しました');
  }
}

// サブタスクも含めて再帰的に削除する関数
async function deleteTaskWithSubtasks(taskId: string) {
  // サブタスクを取得
  const subTasks = await prisma.todo.findMany({
    where: { parentId: taskId },
  });
  
  // 各サブタスクを再帰的に削除
  for (const subTask of subTasks) {
    await deleteTaskWithSubtasks(subTask.id);
  }
  
  // 自分自身を削除
  await prisma.todo.delete({
    where: { id: taskId },
  });
}

// 複数のTodoを一括でステータス更新するアクション
export async function updateManyTodosStatus(ids: string[], status: TodoStatus, userId: string) {
  try {
    await prisma.todo.updateMany({
      where: {
        id: { in: ids },
        userId
      },
      data: { 
        status,
        completed: status === 'DONE'
      },
    });
    return { success: true };
  } catch (error) {
    console.error('複数Todoのステータス更新に失敗しました:', error);
    throw new Error('複数Todoのステータス更新に失敗しました');
  }
}

// 完了済みのTodoをすべて削除するアクション
export async function deleteCompletedTodos(filters: { userId: string }) {
  try {
    // 完了済みの親タスクを取得
    const completedParentTasks = await prisma.todo.findMany({
      where: { 
        completed: true,
        userId: filters.userId,
        parentId: null
      },
    });
    
    // 親タスクごとにサブタスクも含めて削除
    for (const task of completedParentTasks) {
      await deleteTaskWithSubtasks(task.id);
    }
    
    // 完了済みのサブタスクを削除（親が完了していないもの）
    await prisma.todo.deleteMany({
      where: { 
        completed: true,
        userId: filters.userId,
        parentId: { not: null }
      },
    });
    
    return { success: true };
  } catch (error) {
    console.error('完了済みTodoの削除に失敗しました:', error);
    throw new Error('完了済みTodoの削除に失敗しました');
  }
}

// 順序値の定数
const ORDER_BASE = 1000; // 基準値
const ORDER_GAP = 1000;  // 間隔

// 順序値を計算する関数
function calculateOrder(prevOrder: number | null, nextOrder: number | null): number {
  if (prevOrder === null && nextOrder === null) {
    return ORDER_BASE;
  }
  
  if (prevOrder === null) {
    return nextOrder! - ORDER_GAP;
  }
  
  if (nextOrder === null) {
    return prevOrder + ORDER_GAP;
  }
  
  return prevOrder + Math.floor((nextOrder - prevOrder) / 2);
}

// 順序値を再計算する関数
async function rebalanceOrders(
  tx: any, // Prismaトランザクション型
  status: TodoStatus,
  parentId: string | null = null
) {
  const todos = await tx.todo.findMany({
    where: { status, parentId },
    orderBy: { order: 'asc' }
  });

  const updates = todos.map((todo: any, index: number) => ({
    id: todo.id,
    order: (index + 1) * ORDER_GAP
  }));

  // バッチ更新
  for (const update of updates) {
    await tx.todo.update({
      where: { id: update.id },
      data: { order: update.order }
    });
  }
}

// Todoの順序とステータスを更新するアクション
export async function updateTodoOrderAndStatus(
  taskId: string,
  userId: string,
  newStatus: TodoStatus,
  prevOrder: number | null,
  nextOrder: number | null,
  newParentId?: string | null
) {
  try {
    return await prisma.$transaction(async (tx) => {
      // まず対象のタスクを取得
      const task = await tx.todo.findFirst({
        where: { 
          id: taskId,
          userId 
        },
      });
      
      if (!task) {
        throw new Error('タスクが見つかりませんでした');
      }

      // 新しい順序値を計算
      const calculatedOrder = calculateOrder(prevOrder, nextOrder);

      // タスクを更新
      await tx.todo.update({
        where: { id: taskId },
        data: {
          status: newStatus,
          completed: newStatus === 'DONE',
          order: calculatedOrder,
          parentId: newParentId === undefined ? task.parentId : newParentId
        }
      });

      // 更新後のタスクを取得
      const updatedTodo = await tx.todo.findUnique({
        where: { id: taskId },
        include: {
          category: true,
          subTasks: true,
        }
      });
      
      return { success: true, todo: updatedTodo };
    });
  } catch (error) {
    console.error(`タスクの順序・ステータス更新に失敗しました:`, error);
    throw new Error('タスクの順序・ステータス更新に失敗しました');
  }
}

// Todoの順序を更新するアクション
export async function updateTodoOrder(taskId: string, newOrder: number, newParentId?: string | null) {
  try {
    return await prisma.$transaction(async (tx) => {
      // まず対象のタスクを取得
      const task = await tx.todo.findUnique({
        where: { id: taskId },
      });
      
      if (!task) {
        throw new Error('タスクが見つかりませんでした');
      }

      // 同じステータスのタスクを取得（ソート済み）
      const tasksWithSameStatus = await tx.todo.findMany({
        where: {
          status: task.status,
          parentId: newParentId === undefined ? task.parentId : newParentId,
          id: { not: taskId }
        },
        orderBy: { order: 'asc' }
      });

      // 移動先の前後のタスクを特定
      let prevOrder: number | null = null;
      let nextOrder: number | null = null;

      if (newOrder === 0) {
        // 先頭に移動
        nextOrder = tasksWithSameStatus[0]?.order ?? null;
      } else if (newOrder >= tasksWithSameStatus.length) {
        // 末尾に移動
        prevOrder = tasksWithSameStatus[tasksWithSameStatus.length - 1]?.order ?? null;
      } else {
        // 間に移動
        prevOrder = tasksWithSameStatus[newOrder - 1]?.order ?? null;
        nextOrder = tasksWithSameStatus[newOrder]?.order ?? null;
      }

      // 新しい順序値を計算
      const calculatedOrder = calculateOrder(prevOrder, nextOrder);

      // 順序値が近すぎる場合は再計算
      const MIN_GAP = 1;
      if (
        (prevOrder !== null && calculatedOrder - prevOrder <= MIN_GAP) ||
        (nextOrder !== null && nextOrder - calculatedOrder <= MIN_GAP)
      ) {
        await rebalanceOrders(tx, task.status, newParentId === undefined ? task.parentId : newParentId);
        // 再計算後に改めて順序値を取得
        const rebalancedTasks = await tx.todo.findMany({
          where: {
            status: task.status,
            parentId: newParentId === undefined ? task.parentId : newParentId
          },
          orderBy: { order: 'asc' }
        });
        const targetIndex = Math.min(newOrder, rebalancedTasks.length);
        const newTaskOrder = (targetIndex + 1) * ORDER_GAP;
        
        // タスクを更新
        await tx.todo.update({
          where: { id: taskId },
          data: {
            order: newTaskOrder,
            parentId: newParentId === undefined ? task.parentId : newParentId
          }
        });
      } else {
        // 通常の更新
        await tx.todo.update({
          where: { id: taskId },
          data: {
            order: calculatedOrder,
            parentId: newParentId === undefined ? task.parentId : newParentId
          }
        });
      }

      // 更新後のタスクを取得
      const updatedTodo = await tx.todo.findUnique({
        where: { id: taskId }
      });
      
      return { success: true, todo: updatedTodo };
    });
  } catch (error) {
    console.error(`タスクの順序更新に失敗しました:`, error);
    throw new Error('タスクの順序更新に失敗しました');
  }
}
