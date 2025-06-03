import { TodoId, TodoTitle, TodoStatus, TodoPriority, UserId, TodoOrder } from '../../domain/value-objects';
import { ITodoRepository } from '../../domain/repositories';
import { UpdateTodoDto, TodoResponseDto } from '../dtos';
import { TodoMapper } from '../mappers/todo.mapper';

/**
 * Todo更新ユースケース
 */
export class UpdateTodoUseCase {
  constructor(private readonly todoRepository: ITodoRepository) {}

  async execute(
    todoId: string,
    dto: UpdateTodoDto,
    userId: string
  ): Promise<TodoResponseDto> {
    const todoIdVo = new TodoId(todoId);
    const userIdVo = new UserId(userId);

    // Todoを取得
    const todo = await this.todoRepository.findById(todoIdVo);
    if (!todo) {
      throw new Error('Todoが見つかりません');
    }

    // 権限チェック
    if (!todo.getUserId().equals(userIdVo)) {
      throw new Error('他のユーザーのTodoは更新できません');
    }

    // 各フィールドを更新
    if (dto.title !== undefined) {
      todo.updateTitle(new TodoTitle(dto.title));
    }

    if (dto.description !== undefined) {
      todo.updateDescription(dto.description);
    }

    if (dto.dueDate !== undefined) {
      todo.setDueDate(dto.dueDate);
    }

    if (dto.priority !== undefined) {
      todo.changePriority(TodoPriority.fromString(dto.priority));
    }

    if (dto.status !== undefined) {
      todo.changeStatus(TodoStatus.fromString(dto.status));
    }

    if (dto.completed !== undefined) {
      if (dto.completed) {
        todo.complete();
      } else {
        todo.uncomplete();
      }
    }

    if (dto.categoryId !== undefined) {
      todo.setCategory(dto.categoryId);
    }

    if (dto.parentId !== undefined) {
      const parentId = dto.parentId ? new TodoId(dto.parentId) : null;
      todo.setParent(parentId);
    }

    if (dto.order !== undefined) {
      todo.updateOrder(new TodoOrder(dto.order));
    }

    // 保存
    const updatedTodo = await this.todoRepository.save(todo);

    // DTOに変換して返す
    return TodoMapper.toDto(updatedTodo);
  }
}