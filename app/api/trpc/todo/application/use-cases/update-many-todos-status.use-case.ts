import { TodoId, UserId } from '../../domain/value-objects';
import { ITodoRepository } from '../../domain/repositories';
import { UpdateManyTodosDto } from '../dtos';

/**
 * 複数Todo一括ステータス更新ユースケース
 */
export class UpdateManyTodosStatusUseCase {
  constructor(private readonly todoRepository: ITodoRepository) {}

  async execute(dto: UpdateManyTodosDto, userId: string): Promise<void> {
    const userIdVo = new UserId(userId);

    // 各Todoを取得して更新
    for (const id of dto.ids) {
      const todoIdVo = new TodoId(id);
      const todo = await this.todoRepository.findById(todoIdVo);
      
      if (!todo) {
        continue; // 見つからない場合はスキップ
      }

      // 権限チェック
      if (!todo.getUserId().equals(userIdVo)) {
        continue; // 他のユーザーのTodoはスキップ
      }

      // ステータスを更新
      if (dto.completed) {
        todo.complete();
      } else {
        todo.uncomplete();
      }

      // 保存
      await this.todoRepository.save(todo);
    }
  }
}