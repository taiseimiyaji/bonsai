import { UserId } from '../../domain/value-objects';
import { ITodoCategoryRepository } from '../../domain/repositories';
import { TodoCategoryDomainService } from '../../domain/services';
import { UpdateTodoCategoryDto, TodoCategoryResponseDto } from '../dtos';
import { TodoCategoryMapper } from '../mappers/todo.mapper';

/**
 * Todoカテゴリ更新ユースケース
 */
export class UpdateTodoCategoryUseCase {
  constructor(
    private readonly categoryRepository: ITodoCategoryRepository,
    private readonly categoryDomainService: TodoCategoryDomainService
  ) {}

  async execute(
    categoryId: string,
    dto: UpdateTodoCategoryDto,
    userId: string
  ): Promise<TodoCategoryResponseDto> {
    const userIdVo = new UserId(userId);

    // カテゴリを取得
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new Error('カテゴリが見つかりません');
    }

    // 権限チェック
    if (!category.getUserId().equals(userIdVo)) {
      throw new Error('他のユーザーのカテゴリは更新できません');
    }

    // 名前を更新する場合は重複チェック
    if (dto.name && dto.name !== category.getName()) {
      const isDuplicate = await this.categoryDomainService.isDuplicateName(
        dto.name,
        userIdVo,
        categoryId
      );
      if (isDuplicate) {
        throw new Error('同じ名前のカテゴリが既に存在します');
      }
      category.updateName(dto.name);
    }

    // 色を更新
    if (dto.color) {
      category.updateColor(dto.color);
    }

    // 保存
    const updatedCategory = await this.categoryRepository.save(category);

    // DTOに変換して返す
    return TodoCategoryMapper.toDto(updatedCategory);
  }
}