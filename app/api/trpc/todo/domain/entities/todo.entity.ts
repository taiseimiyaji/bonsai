import {
  TodoId,
  TodoTitle,
  TodoStatus,
  TodoPriority,
  UserId,
  TodoOrder,
  TodoStatusValue,
} from '../value-objects';
import { TodoCategory } from './todo-category.entity';

/**
 * Todoエンティティ
 * Todoタスクを表現するドメインエンティティ
 */
export class Todo {
  private subTasks: Todo[] = [];

  constructor(
    private readonly id: TodoId,
    private title: TodoTitle,
    private description: string | null,
    private completed: boolean,
    private archived: boolean,
    private readonly userId: UserId,
    private dueDate: Date | null,
    private priority: TodoPriority,
    private status: TodoStatus,
    private order: TodoOrder,
    private categoryId: string | null,
    private parentId: TodoId | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private category?: TodoCategory | null,
    private parent?: Todo | null
  ) {
    this.validateStatusConsistency();
  }

  /**
   * ステータスとcompletedフラグの整合性を検証
   */
  private validateStatusConsistency(): void {
    if (this.completed && !this.status.isDone()) {
      throw new Error('完了済みタスクのステータスはDONEである必要があります');
    }
    if (!this.completed && this.status.isDone()) {
      throw new Error('未完了タスクのステータスはDONEにできません');
    }
  }

  /**
   * ビジネスルール: アーカイブされたタスクは編集できない
   */
  private ensureNotArchived(): void {
    if (this.archived) {
      throw new Error('アーカイブされたタスクは編集できません');
    }
  }

  // Getters
  getId(): TodoId {
    return this.id;
  }

  getTitle(): TodoTitle {
    return this.title;
  }

  getDescription(): string | null {
    return this.description;
  }

  isCompleted(): boolean {
    return this.completed;
  }

  isArchived(): boolean {
    return this.archived;
  }

  getUserId(): UserId {
    return this.userId;
  }

  getDueDate(): Date | null {
    return this.dueDate;
  }

  getPriority(): TodoPriority {
    return this.priority;
  }

  getStatus(): TodoStatus {
    return this.status;
  }

  getOrder(): TodoOrder {
    return this.order;
  }

  getCategoryId(): string | null {
    return this.categoryId;
  }

  getParentId(): TodoId | null {
    return this.parentId;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getCategory(): TodoCategory | null | undefined {
    return this.category;
  }

  getParent(): Todo | null | undefined {
    return this.parent;
  }

  getSubTasks(): Todo[] {
    return [...this.subTasks];
  }

  // ビジネスロジック

  /**
   * タイトルを更新
   */
  updateTitle(title: TodoTitle): void {
    this.ensureNotArchived();
    this.title = title;
    this.updatedAt = new Date();
  }

  /**
   * 説明を更新
   */
  updateDescription(description: string | null): void {
    this.ensureNotArchived();
    this.description = description;
    this.updatedAt = new Date();
  }

  /**
   * 期限を設定
   */
  setDueDate(dueDate: Date | null): void {
    this.ensureNotArchived();
    this.dueDate = dueDate;
    this.updatedAt = new Date();
  }

  /**
   * 優先度を変更
   */
  changePriority(priority: TodoPriority): void {
    this.ensureNotArchived();
    this.priority = priority;
    this.updatedAt = new Date();
  }

  /**
   * ステータスを変更
   */
  changeStatus(status: TodoStatus): void {
    this.ensureNotArchived();
    
    // DONEに変更する場合は自動的にcompletedをtrueに
    if (status.isDone()) {
      this.completed = true;
    }
    // DONEから他のステータスに変更する場合は自動的にcompletedをfalseに
    else if (this.status.isDone() && !status.isDone()) {
      this.completed = false;
    }
    
    this.status = status;
    this.validateStatusConsistency();
    this.updatedAt = new Date();
  }

  /**
   * タスクを完了にする
   */
  complete(): void {
    this.ensureNotArchived();
    this.completed = true;
    this.status = TodoStatus.done();
    this.updatedAt = new Date();
  }

  /**
   * タスクを未完了に戻す
   */
  uncomplete(): void {
    this.ensureNotArchived();
    this.completed = false;
    this.status = TodoStatus.todo();
    this.updatedAt = new Date();
  }

  /**
   * タスクをアーカイブ
   */
  archive(): void {
    if (!this.completed) {
      throw new Error('未完了のタスクはアーカイブできません');
    }
    this.archived = true;
    this.updatedAt = new Date();
  }

  /**
   * アーカイブを解除
   */
  unarchive(): void {
    this.archived = false;
    this.updatedAt = new Date();
  }

  /**
   * カテゴリを設定
   */
  setCategory(categoryId: string | null): void {
    this.ensureNotArchived();
    this.categoryId = categoryId;
    this.updatedAt = new Date();
  }

  /**
   * 表示順序を更新
   */
  updateOrder(order: TodoOrder): void {
    this.ensureNotArchived();
    this.order = order;
    this.updatedAt = new Date();
  }

  /**
   * 親タスクを設定
   */
  setParent(parentId: TodoId | null): void {
    this.ensureNotArchived();
    
    // 自分自身を親にすることはできない
    if (parentId && parentId.equals(this.id)) {
      throw new Error('タスクは自分自身を親にすることはできません');
    }
    
    this.parentId = parentId;
    this.updatedAt = new Date();
  }

  /**
   * サブタスクを追加
   */
  addSubTask(subTask: Todo): void {
    // サブタスクのユーザーIDが一致することを確認
    if (!subTask.getUserId().equals(this.userId)) {
      throw new Error('異なるユーザーのタスクをサブタスクにすることはできません');
    }
    
    // 循環参照のチェック
    if (this.wouldCreateCycle(subTask)) {
      throw new Error('循環参照が発生するため、このタスクをサブタスクにすることはできません');
    }
    
    this.subTasks.push(subTask);
  }

  /**
   * 循環参照をチェック
   */
  private wouldCreateCycle(potentialSubTask: Todo): boolean {
    // サブタスクが自分自身の場合
    if (potentialSubTask.getId().equals(this.id)) {
      return true;
    }
    
    // サブタスクの祖先に自分がいる場合
    let current = potentialSubTask.getParent();
    while (current) {
      if (current.getId().equals(this.id)) {
        return true;
      }
      current = current.getParent();
    }
    
    return false;
  }

  /**
   * 期限切れかどうかを判定
   */
  isOverdue(): boolean {
    if (!this.dueDate || this.completed) {
      return false;
    }
    return this.dueDate < new Date();
  }

  /**
   * 今日が期限かどうかを判定
   */
  isDueToday(): boolean {
    if (!this.dueDate) {
      return false;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.dueDate >= today && this.dueDate < tomorrow;
  }

  /**
   * 同一性の比較
   */
  equals(other: Todo): boolean {
    return this.id.equals(other.id);
  }
}