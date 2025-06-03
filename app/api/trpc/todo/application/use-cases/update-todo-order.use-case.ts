import { TodoId, UserId } from '../../domain/value-objects';
import { ITodoRepository } from '../../domain/repositories';
import { TodoDomainService } from '../../domain/services';
import { UpdateTodoOrderDto, TodoResponseDto } from '../dtos';
import { TodoMapper } from '../mappers/todo.mapper';

/**
 * Todo表示順序更新ユースケース
 */
export class UpdateTodoOrderUseCase {
  constructor(
    private readonly todoRepository: ITodoRepository,
    private readonly todoDomainService: TodoDomainService
  ) {}

  async execute(dto: UpdateTodoOrderDto, userId: string): Promise<TodoResponseDto> {
    const userIdVo = new UserId(userId);
    const taskIdVo = new TodoId(dto.taskId);
    const newParentId = dto.newParentId !== undefined 
      ? (dto.newParentId ? new TodoId(dto.newParentId) : null)
      : undefined;

    // タスクの順序を更新
    const updatedTodo = await this.todoDomainService.reorderTasks(
      userIdVo,
      taskIdVo,
      dto.newOrder,
      newParentId
    );

    // DTOに変換して返す
    return TodoMapper.toDto(updatedTodo);
  }
}