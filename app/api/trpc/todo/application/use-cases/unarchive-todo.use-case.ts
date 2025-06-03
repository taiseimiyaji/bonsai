import { TodoId, UserId } from '../../domain/value-objects';
import { ITodoRepository } from '../../domain/repositories';
import { TodoResponseDto } from '../dtos';
import { TodoMapper } from '../mappers/todo.mapper';

/**
 * Todoアーカイブ解除ユースケース
 */
export class UnarchiveTodoUseCase {
  constructor(private readonly todoRepository: ITodoRepository) {}

  async execute(todoId: string, userId: string): Promise<TodoResponseDto> {
    const todoIdVo = new TodoId(todoId);
    const userIdVo = new UserId(userId);

    // Todoを取得
    const todo = await this.todoRepository.findById(todoIdVo);
    if (!todo) {
      throw new Error('Todoが見つかりません');
    }

    // 権限チェック
    if (!todo.getUserId().equals(userIdVo)) {
      throw new Error('他のユーザーのTodoはアーカイブ解除できません');
    }

    // アーカイブ解除
    todo.unarchive();

    // 保存
    const unarchivedTodo = await this.todoRepository.save(todo);

    // DTOに変換して返す
    return TodoMapper.toDto(unarchivedTodo);
  }
}