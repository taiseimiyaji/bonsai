import { UserId, TodoStatus, TodoPriority, TodoId } from '../../domain/value-objects';
import { ITodoRepository, TodoSearchCriteria, TodoSortCriteria } from '../../domain/repositories';
import { TodoSearchDto, TodoSortDto, TodoResponseDto } from '../dtos';
import { TodoMapper } from '../mappers/todo.mapper';

/**
 * Todo一覧取得ユースケース
 */
export class GetTodosUseCase {
  constructor(private readonly todoRepository: ITodoRepository) {}

  async execute(
    userId: string,
    searchDto?: TodoSearchDto,
    sortDto?: TodoSortDto
  ): Promise<TodoResponseDto[]> {
    const userIdVo = new UserId(userId);

    // 検索条件を構築
    const criteria: TodoSearchCriteria = {
      userId: userIdVo,
      archived: false, // デフォルトでアーカイブされていないものを取得
    };

    if (searchDto) {
      if (searchDto.status) {
        criteria.status = TodoStatus.fromString(searchDto.status);
      }
      if (searchDto.priority) {
        criteria.priority = TodoPriority.fromString(searchDto.priority);
      }
      if (searchDto.categoryId) {
        criteria.categoryId = searchDto.categoryId;
      }
      if (searchDto.dueDate) {
        criteria.dueDate = searchDto.dueDate;
      }
      if (searchDto.search) {
        criteria.search = searchDto.search;
      }
      if (searchDto.parentId !== undefined) {
        criteria.parentId = searchDto.parentId ? new TodoId(searchDto.parentId) : null;
      }
    }

    // ソート条件を構築
    const sortCriteria: TodoSortCriteria | undefined = sortDto
      ? {
          field: sortDto.field,
          direction: sortDto.direction,
        }
      : undefined;

    // Todoを取得
    const todos = await this.todoRepository.findByCriteria(criteria, sortCriteria);

    // DTOに変換して返す
    return TodoMapper.toDtoList(todos);
  }
}