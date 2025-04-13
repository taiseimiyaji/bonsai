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

// カテゴリのZodスキーマ
export const todoCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: 'カテゴリ名は必須です' }),
  color: z.string().default('#3B82F6'),
  userId: z.string(),
});

export type TodoCategory = z.infer<typeof todoCategorySchema>;

// Todo一覧を取得するアクション（フィルタリング機能付き）
export async function getTodos(
  userId: string, 
  filters?: {
    status?: TodoStatus;
    priority?: TodoPriority;
    categoryId?: string;
    dueDate?: { from?: Date; to?: Date };
    search?: string;
    parentId?: string | null; // nullを指定すると最上位のタスクのみ取得
  },
  sort?: {
    field: 'dueDate' | 'priority' | 'createdAt' | 'title' | 'order';
    direction: 'asc' | 'desc';
  }
) {
  try {
    // フィルタリング条件の構築
    const where: any = { userId };
    
    if (filters) {
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.priority) {
        where.priority = filters.priority;
      }
      
      if (filters.categoryId) {
        where.categoryId = filters.categoryId;
      }
      
      if (filters.dueDate) {
        where.dueDate = {};
        if (filters.dueDate.from) {
          where.dueDate.gte = filters.dueDate.from;
        }
        if (filters.dueDate.to) {
          where.dueDate.lte = filters.dueDate.to;
        }
      }
      
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
      
      // parentIdが明示的にnullの場合は最上位タスクのみ取得
      if (filters.parentId !== undefined) {
        where.parentId = filters.parentId;
      }
    }
    
    // ソート条件の構築
    let orderBy: any;
    if (sort) {
      // 単一のフィールドでソート
      orderBy = { [sort.field]: sort.direction };
    } else {
      // デフォルトは複数フィールドでソート（配列形式で指定）
      orderBy = [
        { order: 'asc' },
        { createdAt: 'desc' }
      ];
    }
    
    const todos = await prisma.todo.findMany({
      where,
      orderBy,
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
export async function updateTodo(id: string, userId: string, data: Partial<z.infer<typeof todoSchema>>) {
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

// タスクの順序を更新するアクション
export async function updateTaskOrder(userId: string, taskId: string, newOrder: number, newParentId?: string | null) {
  try {
    const task = await prisma.todo.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });
    
    if (!task) {
      throw new Error('タスクが見つかりませんでした');
    }
    
    // 親タスクが変更される場合
    if (newParentId !== undefined && newParentId !== task.parentId) {
      await prisma.todo.update({
        where: { id: taskId },
        data: {
          parentId: newParentId,
          order: newOrder,
        },
      });
      
      // 元の親の下にあるタスクの順序を再整列
      await reorderTasks(userId, task.parentId);
      
      // 新しい親の下にあるタスクの順序を再整列
      if (newParentId !== null) {
        await reorderTasks(userId, newParentId);
      }
    } 
    // 同じ親の中での順序変更
    else {
      await prisma.todo.update({
        where: { id: taskId },
        data: { order: newOrder },
      });
      
      // 同じ親の下にあるタスクの順序を再整列
      await reorderTasks(userId, task.parentId);
    }
    
    return { success: true };
  } catch (error) {
    console.error('タスクの順序更新に失敗しました:', error);
    throw new Error('タスクの順序更新に失敗しました');
  }
}

// 同じ親を持つタスクの順序を連番で振り直す
async function reorderTasks(userId: string, parentId: string | null) {
  const tasks = await prisma.todo.findMany({
    where: {
      userId,
      parentId,
    },
    orderBy: { order: 'asc' },
  });
  
  for (let i = 0; i < tasks.length; i++) {
    await prisma.todo.update({
      where: { id: tasks[i].id },
      data: { order: i },
    });
  }
}

// 複数のTodoを一括で完了/未完了に更新するアクション
export async function updateManyTodosStatus(ids: string[], userId: string, completed: boolean) {
  try {
    await prisma.todo.updateMany({
      where: {
        id: { in: ids },
        userId
      },
      data: { 
        completed,
        status: completed ? 'DONE' : 'TODO'
      },
    });
    return { success: true };
  } catch (error) {
    console.error('複数Todoのステータス更新に失敗しました:', error);
    throw new Error('複数Todoのステータス更新に失敗しました');
  }
}

// 完了済みのTodoをすべて削除するアクション
export async function deleteCompletedTodos(userId: string) {
  try {
    // 完了済みの親タスクを取得
    const completedParentTasks = await prisma.todo.findMany({
      where: { 
        completed: true,
        userId,
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
        userId,
        parentId: { not: null }
      },
    });
    
    return { success: true };
  } catch (error) {
    console.error('完了済みTodoの削除に失敗しました:', error);
    throw new Error('完了済みTodoの削除に失敗しました');
  }
}

// カテゴリ関連のアクション

// カテゴリ一覧を取得
export async function getTodoCategories(userId: string) {
  try {
    const categories = await prisma.todoCategory.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
    
    return { categories };
  } catch (error) {
    console.error('カテゴリの取得に失敗しました:', error);
    throw new Error('カテゴリの取得に失敗しました');
  }
}

// カテゴリを作成
export async function createTodoCategory(data: z.infer<typeof todoCategorySchema>) {
  try {
    const category = await prisma.todoCategory.create({
      data: {
        name: data.name,
        color: data.color,
        userId: data.userId,
      },
    });
    
    return { category };
  } catch (error) {
    console.error('カテゴリの作成に失敗しました:', error);
    throw new Error('カテゴリの作成に失敗しました');
  }
}

// カテゴリを更新
export async function updateTodoCategory(id: string, userId: string, data: Partial<z.infer<typeof todoCategorySchema>>) {
  try {
    const existingCategory = await prisma.todoCategory.findFirst({
      where: { 
        id,
        userId 
      },
    });
    
    if (!existingCategory) {
      throw new Error('更新対象のカテゴリが見つかりませんでした');
    }
    
    const category = await prisma.todoCategory.update({
      where: { id },
      data,
    });
    
    return { category };
  } catch (error) {
    console.error(`ID: ${id} のカテゴリの更新に失敗しました:`, error);
    throw new Error('カテゴリの更新に失敗しました');
  }
}

// カテゴリを削除
export async function deleteTodoCategory(id: string, userId: string) {
  try {
    const existingCategory = await prisma.todoCategory.findFirst({
      where: { 
        id,
        userId 
      },
    });
    
    if (!existingCategory) {
      throw new Error('削除対象のカテゴリが見つかりませんでした');
    }
    
    // このカテゴリを使用しているタスクのカテゴリをnullに設定
    await prisma.todo.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });
    
    // カテゴリを削除
    await prisma.todoCategory.delete({
      where: { id },
    });
    
    return { success: true };
  } catch (error) {
    console.error(`ID: ${id} のカテゴリの削除に失敗しました:`, error);
    throw new Error('カテゴリの削除に失敗しました');
  }
}
