import { UserId } from '../../domain/value-objects';
import { ITodoRepository } from '../../domain/repositories';
import { TodoResponseDto } from '../dtos';
import { TodoMapper } from '../mappers/todo.mapper';

/**
 * アーカイブ済みTodo取得ユースケース
 */
export class GetArchivedTodosUseCase {
  constructor(private readonly todoRepository: ITodoRepository) {}

  async execute(userId: string): Promise<TodoResponseDto[]> {
    const userIdVo = new UserId(userId);

    // アーカイブ済みTodoを取得
    const todos = await this.todoRepository.findArchived(userIdVo);

    // DTOに変換して返す
    return TodoMapper.toDtoList(todos);
  }
}