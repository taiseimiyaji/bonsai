import { Todo, TodoCategory } from '../../domain/entities';
import { TodoResponseDto, TodoCategoryResponseDto } from '../dtos';

/**
 * TodoエンティティとDTOの相互変換を行うマッパー
 */
export class TodoMapper {
  /**
   * TodoエンティティをDTOに変換
   */
  static toDto(todo: Todo): TodoResponseDto {
    const dto: TodoResponseDto = {
      id: todo.getId().getValue(),
      title: todo.getTitle().getValue(),
      description: todo.getDescription(),
      completed: todo.isCompleted(),
      archived: todo.isArchived(),
      userId: todo.getUserId().getValue(),
      dueDate: todo.getDueDate(),
      priority: todo.getPriority().getValue(),
      status: todo.getStatus().getValue(),
      order: todo.getOrder().getValue(),
      categoryId: todo.getCategoryId(),
      parentId: todo.getParentId()?.getValue() || null,
      createdAt: todo.getCreatedAt(),
      updatedAt: todo.getUpdatedAt(),
    };

    // カテゴリがある場合は変換
    if (todo.getCategory()) {
      dto.category = TodoCategoryMapper.toDto(todo.getCategory()!);
    }

    // サブタスクがある場合は再帰的に変換
    const subTasks = todo.getSubTasks();
    if (subTasks.length > 0) {
      dto.subTasks = subTasks.map(subTask => TodoMapper.toDto(subTask));
    }

    return dto;
  }

  /**
   * 複数のTodoエンティティをDTOに変換
   */
  static toDtoList(todos: Todo[]): TodoResponseDto[] {
    return todos.map(todo => TodoMapper.toDto(todo));
  }
}

/**
 * TodoCategoryエンティティとDTOの相互変換を行うマッパー
 */
export class TodoCategoryMapper {
  /**
   * TodoCategoryエンティティをDTOに変換
   */
  static toDto(category: TodoCategory): TodoCategoryResponseDto {
    return {
      id: category.getId(),
      name: category.getName(),
      color: category.getColor(),
      userId: category.getUserId().getValue(),
      createdAt: category.getCreatedAt(),
      updatedAt: category.getUpdatedAt(),
    };
  }

  /**
   * 複数のTodoCategoryエンティティをDTOに変換
   */
  static toDtoList(categories: TodoCategory[]): TodoCategoryResponseDto[] {
    return categories.map(category => TodoCategoryMapper.toDto(category));
  }
}