import { UserId } from '../../domain/value-objects';
import { ITodoRepository } from '../../domain/repositories';
import { TodoDomainService } from '../../domain/services';

/**
 * 完了済みTodo一括削除ユースケース
 */
export class DeleteCompletedTodosUseCase {
  constructor(
    private readonly todoRepository: ITodoRepository,
    private readonly todoDomainService: TodoDomainService
  ) {}

  async execute(userId: string): Promise<void> {
    const userIdVo = new UserId(userId);

    // 完了済みTodoを取得
    const completedTodos = await this.todoRepository.findByCriteria({
      userId: userIdVo,
      archived: false,
    });

    // 完了済みのもののみフィルタリング
    const todosToDelete = completedTodos.filter(todo => todo.isCompleted());

    // 各Todoをサブタスクも含めて削除
    for (const todo of todosToDelete) {
      await this.todoDomainService.deleteWithSubTasks(todo.getId());
    }
  }
}