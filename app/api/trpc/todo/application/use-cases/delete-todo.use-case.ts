import { TodoId, UserId } from '../../domain/value-objects';
import { ITodoRepository } from '../../domain/repositories';
import { TodoDomainService } from '../../domain/services';

/**
 * Todo削除ユースケース
 */
export class DeleteTodoUseCase {
  constructor(
    private readonly todoRepository: ITodoRepository,
    private readonly todoDomainService: TodoDomainService
  ) {}

  async execute(todoId: string, userId: string): Promise<void> {
    const todoIdVo = new TodoId(todoId);
    const userIdVo = new UserId(userId);

    // Todoを取得
    const todo = await this.todoRepository.findById(todoIdVo);
    if (!todo) {
      throw new Error('Todoが見つかりません');
    }

    // 権限チェック
    if (!todo.getUserId().equals(userIdVo)) {
      throw new Error('他のユーザーのTodoは削除できません');
    }

    // サブタスクも含めて削除
    await this.todoDomainService.deleteWithSubTasks(todoIdVo);
  }
}