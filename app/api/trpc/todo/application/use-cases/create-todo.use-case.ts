import { Todo } from '../../domain/entities';
import {
  TodoId,
  TodoTitle,
  TodoStatus,
  TodoPriority,
  UserId,
  TodoOrder,
} from '../../domain/value-objects';
import { ITodoRepository } from '../../domain/repositories';
import { TodoDomainService } from '../../domain/services';
import { CreateTodoDto, TodoResponseDto } from '../dtos';
import { TodoMapper } from '../mappers/todo.mapper';

/**
 * Todo作成ユースケース
 */
export class CreateTodoUseCase {
  constructor(
    private readonly todoRepository: ITodoRepository,
    private readonly todoDomainService: TodoDomainService
  ) {}

  async execute(dto: CreateTodoDto, userId: string): Promise<TodoResponseDto> {
    // 値オブジェクトに変換
    const userIdVo = new UserId(userId);
    const title = new TodoTitle(dto.title);
    const status = TodoStatus.fromString(dto.status);
    const priority = TodoPriority.fromString(dto.priority);
    
    // 親タスクIDの値オブジェクト
    const parentId = dto.parentId ? new TodoId(dto.parentId) : null;
    
    // 新しいタスクの表示順序を計算
    const order = await this.todoDomainService.calculateNewTaskOrder(
      userIdVo,
      parentId
    );

    // 新しいTodoエンティティを作成
    const todo = new Todo(
      this.todoRepository.nextId(),
      title,
      dto.description || null,
      false, // completed
      false, // archived
      userIdVo,
      dto.dueDate || null,
      priority,
      status,
      order,
      dto.categoryId || null,
      parentId,
      new Date(),
      new Date()
    );

    // 保存
    const savedTodo = await this.todoRepository.save(todo);

    // DTOに変換して返す
    return TodoMapper.toDto(savedTodo);
  }
}