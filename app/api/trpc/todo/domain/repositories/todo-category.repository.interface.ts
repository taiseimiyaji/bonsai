import { TodoCategory } from '../entities';
import { UserId } from '../value-objects';

/**
 * TodoCategoryリポジトリインターフェース
 * TodoCategoryエンティティの永続化を抽象化
 */
export interface ITodoCategoryRepository {
  /**
   * IDでカテゴリを取得
   */
  findById(id: string): Promise<TodoCategory | null>;

  /**
   * ユーザーの全カテゴリを取得
   */
  findByUserId(userId: UserId): Promise<TodoCategory[]>;

  /**
   * カテゴリを保存（新規作成または更新）
   */
  save(category: TodoCategory): Promise<TodoCategory>;

  /**
   * カテゴリを削除
   */
  delete(id: string): Promise<void>;

  /**
   * カテゴリを使用しているTodoの数を取得
   */
  countTodosByCategory(categoryId: string): Promise<number>;

  /**
   * 次のIDを生成
   */
  nextId(): string;
}