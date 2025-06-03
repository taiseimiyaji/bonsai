/**
 * TodoPriority値オブジェクト
 * Todoの優先度を表現する値オブジェクト
 */
export enum TodoPriorityValue {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export class TodoPriority {
  constructor(private readonly value: TodoPriorityValue) {}

  getValue(): TodoPriorityValue {
    return this.value;
  }

  isHigh(): boolean {
    return this.value === TodoPriorityValue.HIGH;
  }

  isMedium(): boolean {
    return this.value === TodoPriorityValue.MEDIUM;
  }

  isLow(): boolean {
    return this.value === TodoPriorityValue.LOW;
  }

  getWeight(): number {
    switch (this.value) {
      case TodoPriorityValue.HIGH:
        return 3;
      case TodoPriorityValue.MEDIUM:
        return 2;
      case TodoPriorityValue.LOW:
        return 1;
    }
  }

  equals(other: TodoPriority): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static fromString(value: string): TodoPriority {
    if (!Object.values(TodoPriorityValue).includes(value as TodoPriorityValue)) {
      throw new Error(`不正な優先度値: ${value}`);
    }
    return new TodoPriority(value as TodoPriorityValue);
  }

  static high(): TodoPriority {
    return new TodoPriority(TodoPriorityValue.HIGH);
  }

  static medium(): TodoPriority {
    return new TodoPriority(TodoPriorityValue.MEDIUM);
  }

  static low(): TodoPriority {
    return new TodoPriority(TodoPriorityValue.LOW);
  }
}