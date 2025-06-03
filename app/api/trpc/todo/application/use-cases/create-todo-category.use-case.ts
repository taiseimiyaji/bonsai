import { TodoCategory } from '../../domain/entities';
import { UserId } from '../../domain/value-objects';
import { ITodoCategoryRepository } from '../../domain/repositories';
import { TodoCategoryDomainService } from '../../domain/services';
import { CreateTodoCategoryDto, TodoCategoryResponseDto } from '../dtos';
import { TodoCategoryMapper } from '../mappers/todo.mapper';

/**
 * Todoカテゴリ作成ユースケース
 */
export class CreateTodoCategoryUseCase {
  constructor(
    private readonly categoryRepository: ITodoCategoryRepository,
    private readonly categoryDomainService: TodoCategoryDomainService
  ) {}

  async execute(
    dto: CreateTodoCategoryDto,
    userId: string
  ): Promise<TodoCategoryResponseDto> {
    const userIdVo = new UserId(userId);

    // カテゴリ名の重複チェック
    const isDuplicate = await this.categoryDomainService.isDuplicateName(
      dto.name,
      userIdVo
    );
    if (isDuplicate) {
      throw new Error('同じ名前のカテゴリが既に存在します');
    }

    // 新しいカテゴリエンティティを作成
    const category = new TodoCategory(
      this.categoryRepository.nextId(),
      dto.name,
      dto.color,
      userIdVo,
      new Date(),
      new Date()
    );

    // 保存
    const savedCategory = await this.categoryRepository.save(category);

    // DTOに変換して返す
    return TodoCategoryMapper.toDto(savedCategory);
  }
}