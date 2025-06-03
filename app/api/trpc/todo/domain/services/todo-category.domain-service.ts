import { TodoCategory } from '../entities';
import { ITodoCategoryRepository, ITodoRepository } from '../repositories';
import { UserId } from '../value-objects';

/**
 * TodoCategoryドメインサービス
 * カテゴリに関するビジネスロジックを実装
 */
export class TodoCategoryDomainService {
  constructor(
    private readonly categoryRepository: ITodoCategoryRepository,
    private readonly todoRepository: ITodoRepository
  ) {}

  /**
   * カテゴリを削除（関連するTodoのカテゴリIDをnullに更新）
   */
  async deleteCategory(categoryId: string, userId: UserId): Promise<void> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new Error('カテゴリが見つかりません');
    }

    if (!category.getUserId().equals(userId)) {
      throw new Error('他のユーザーのカテゴリは削除できません');
    }

    // このカテゴリを使用しているTodoを取得
    const todos = await this.todoRepository.findByCriteria({
      userId,
      categoryId,
    });

    // 各TodoのカテゴリIDをnullに更新
    for (const todo of todos) {
      todo.setCategory(null);
      await this.todoRepository.save(todo);
    }

    // カテゴリを削除
    await this.categoryRepository.delete(categoryId);
  }

  /**
   * カテゴリ名の重複チェック
   */
  async isDuplicateName(
    name: string,
    userId: UserId,
    excludeId?: string
  ): Promise<boolean> {
    const categories = await this.categoryRepository.findByUserId(userId);
    return categories.some(
      category => 
        category.getName() === name && 
        category.getId() !== excludeId
    );
  }
}