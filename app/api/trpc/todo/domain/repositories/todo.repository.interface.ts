import { Todo } from '../entities';
import { TodoId, UserId, TodoStatus, TodoPriority } from '../value-objects';

/**
 * Todoの検索条件
 */
export interface TodoSearchCriteria {
  userId: UserId;
  status?: TodoStatus;
  priority?: TodoPriority;
  categoryId?: string;
  dueDate?: {
    from?: Date;
    to?: Date;
  };
  search?: string;
  parentId?: TodoId | null;
  archived?: boolean;
}

/**
 * Todoのソート条件
 */
export interface TodoSortCriteria {
  field: 'dueDate' | 'priority' | 'createdAt' | 'title' | 'order';
  direction: 'asc' | 'desc';
}

/**
 * Todoリポジトリインターフェース
 * Todoエンティティの永続化を抽象化
 */
export interface ITodoRepository {
  /**
   * IDでTodoを取得
   */
  findById(id: TodoId): Promise<Todo | null>;

  /**
   * 検索条件に基づいてTodoリストを取得
   */
  findByCriteria(
    criteria: TodoSearchCriteria,
    sort?: TodoSortCriteria
  ): Promise<Todo[]>;

  /**
   * ユーザーのアーカイブ済みTodoを取得
   */
  findArchived(userId: UserId): Promise<Todo[]>;

  /**
   * Todoを保存（新規作成または更新）
   */
  save(todo: Todo): Promise<Todo>;

  /**
   * Todoを削除
   */
  delete(id: TodoId): Promise<void>;

  /**
   * 複数のTodoを一括削除
   */
  deleteMany(ids: TodoId[]): Promise<void>;

  /**
   * 同じ親を持つタスクの最大order値を取得
   */
  getMaxOrder(userId: UserId, parentId: TodoId | null): Promise<number>;

  /**
   * 次のIDを生成
   */
  nextId(): TodoId;
}