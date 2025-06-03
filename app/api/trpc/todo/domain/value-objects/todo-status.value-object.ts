/**
 * TodoStatus値オブジェクト
 * Todoのステータスを表現する値オブジェクト
 */
export enum TodoStatusValue {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export class TodoStatus {
  constructor(private readonly value: TodoStatusValue) {}

  getValue(): TodoStatusValue {
    return this.value;
  }

  isTodo(): boolean {
    return this.value === TodoStatusValue.TODO;
  }

  isInProgress(): boolean {
    return this.value === TodoStatusValue.IN_PROGRESS;
  }

  isDone(): boolean {
    return this.value === TodoStatusValue.DONE;
  }

  equals(other: TodoStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static fromString(value: string): TodoStatus {
    if (!Object.values(TodoStatusValue).includes(value as TodoStatusValue)) {
      throw new Error(`不正なステータス値: ${value}`);
    }
    return new TodoStatus(value as TodoStatusValue);
  }

  static todo(): TodoStatus {
    return new TodoStatus(TodoStatusValue.TODO);
  }

  static inProgress(): TodoStatus {
    return new TodoStatus(TodoStatusValue.IN_PROGRESS);
  }

  static done(): TodoStatus {
    return new TodoStatus(TodoStatusValue.DONE);
  }
}