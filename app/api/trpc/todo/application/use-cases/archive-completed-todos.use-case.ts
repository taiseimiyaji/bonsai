import { UserId } from '../../domain/value-objects';
import { ITodoRepository } from '../../domain/repositories';
import { TodoDomainService } from '../../domain/services';

/**
 * 完了済みTodo一括アーカイブユースケース
 */
export class ArchiveCompletedTodosUseCase {
  constructor(
    private readonly todoRepository: ITodoRepository,
    private readonly todoDomainService: TodoDomainService
  ) {}

  async execute(userId: string): Promise<{ count: number }> {
    const userIdVo = new UserId(userId);

    // 完了済みTodoをアーカイブ
    const archivedCount = await this.todoDomainService.archiveCompletedTodos(userIdVo);

    return { count: archivedCount };
  }
}