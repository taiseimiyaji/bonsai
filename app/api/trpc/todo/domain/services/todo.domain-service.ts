import { Todo } from '../entities';
import { TodoId, TodoOrder, UserId } from '../value-objects';
import { ITodoRepository } from '../repositories';

/**
 * Todoドメインサービス
 * 複数のエンティティにまたがるビジネスロジックを実装
 */
export class TodoDomainService {
  constructor(private readonly todoRepository: ITodoRepository) {}

  /**
   * サブタスクも含めて再帰的にTodoを削除
   */
  async deleteWithSubTasks(todoId: TodoId): Promise<void> {
    const todo = await this.todoRepository.findById(todoId);
    if (!todo) {
      throw new Error('削除対象のTodoが見つかりません');
    }

    // サブタスクを取得
    const subTasks = await this.todoRepository.findByCriteria({
      userId: todo.getUserId(),
      parentId: todoId,
    });

    // 各サブタスクを再帰的に削除
    for (const subTask of subTasks) {
      await this.deleteWithSubTasks(subTask.getId());
    }

    // 自分自身を削除
    await this.todoRepository.delete(todoId);
  }

  /**
   * 完了済みのTodoを一括でアーカイブ
   */
  async archiveCompletedTodos(userId: UserId): Promise<number> {
    const completedTodos = await this.todoRepository.findByCriteria({
      userId,
      archived: false,
    });

    const todosToArchive = completedTodos.filter(todo => todo.isCompleted());
    
    let archivedCount = 0;
    for (const todo of todosToArchive) {
      todo.archive();
      await this.todoRepository.save(todo);
      archivedCount++;
    }

    return archivedCount;
  }

  /**
   * タスクの表示順序を再計算
   */
  async reorderTasks(
    userId: UserId,
    taskId: TodoId,
    newOrder: number,
    newParentId?: TodoId | null
  ): Promise<Todo> {
    const task = await this.todoRepository.findById(taskId);
    if (!task) {
      throw new Error('タスクが見つかりません');
    }

    if (!task.getUserId().equals(userId)) {
      throw new Error('他のユーザーのタスクは操作できません');
    }

    // 親タスクが変更される場合の検証
    if (newParentId !== undefined && newParentId !== null) {
      const newParent = await this.todoRepository.findById(newParentId);
      if (!newParent) {
        throw new Error('親タスクが見つかりません');
      }
      
      if (!newParent.getUserId().equals(userId)) {
        throw new Error('他のユーザーのタスクを親にすることはできません');
      }

      // 循環参照のチェック
      if (await this.wouldCreateCycle(taskId, newParentId)) {
        throw new Error('循環参照が発生するため、この操作は実行できません');
      }

      task.setParent(newParentId);
    }

    task.updateOrder(new TodoOrder(newOrder));
    return await this.todoRepository.save(task);
  }

  /**
   * 循環参照をチェック
   */
  private async wouldCreateCycle(
    taskId: TodoId,
    potentialParentId: TodoId
  ): Promise<boolean> {
    // 自分自身を親にしようとしている場合
    if (taskId.equals(potentialParentId)) {
      return true;
    }

    // 潜在的な親の祖先を辿って自分がいないかチェック
    let currentId: TodoId | null = potentialParentId;
    while (currentId) {
      const current = await this.todoRepository.findById(currentId);
      if (!current) {
        break;
      }
      
      const parentId = current.getParentId();
      if (parentId && parentId.equals(taskId)) {
        return true;
      }
      
      currentId = parentId;
    }

    return false;
  }

  /**
   * 新しいタスクの表示順序を計算
   */
  async calculateNewTaskOrder(
    userId: UserId,
    parentId: TodoId | null
  ): Promise<TodoOrder> {
    const maxOrder = await this.todoRepository.getMaxOrder(userId, parentId);
    return new TodoOrder(maxOrder + 1);
  }
}