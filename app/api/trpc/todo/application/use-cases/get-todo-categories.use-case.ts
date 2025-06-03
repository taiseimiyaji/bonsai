import { UserId } from '../../domain/value-objects';
import { ITodoCategoryRepository } from '../../domain/repositories';
import { TodoCategoryResponseDto } from '../dtos';
import { TodoCategoryMapper } from '../mappers/todo.mapper';

/**
 * Todoカテゴリ一覧取得ユースケース
 */
export class GetTodoCategoriesUseCase {
  constructor(private readonly categoryRepository: ITodoCategoryRepository) {}

  async execute(userId: string): Promise<TodoCategoryResponseDto[]> {
    const userIdVo = new UserId(userId);

    // カテゴリ一覧を取得
    const categories = await this.categoryRepository.findByUserId(userIdVo);

    // DTOに変換して返す
    return TodoCategoryMapper.toDtoList(categories);
  }
}