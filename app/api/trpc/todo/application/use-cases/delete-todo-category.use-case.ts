import { UserId } from '../../domain/value-objects';
import { ITodoCategoryRepository, ITodoRepository } from '../../domain/repositories';
import { TodoCategoryDomainService } from '../../domain/services';

/**
 * Todoカテゴリ削除ユースケース
 */
export class DeleteTodoCategoryUseCase {
  constructor(
    private readonly categoryRepository: ITodoCategoryRepository,
    private readonly todoRepository: ITodoRepository,
    private readonly categoryDomainService: TodoCategoryDomainService
  ) {}

  async execute(categoryId: string, userId: string): Promise<void> {
    const userIdVo = new UserId(userId);

    // カテゴリを削除（関連するTodoのカテゴリIDも更新）
    await this.categoryDomainService.deleteCategory(categoryId, userIdVo);
  }
}