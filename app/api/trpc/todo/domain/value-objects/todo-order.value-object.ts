/**
 * TodoOrder値オブジェクト
 * Todoの表示順序を表現する値オブジェクト
 */
export class TodoOrder {
  constructor(private readonly value: number) {
    if (!Number.isInteger(value)) {
      throw new Error('表示順序は整数である必要があります');
    }
    if (value < 0) {
      throw new Error('表示順序は0以上である必要があります');
    }
  }

  getValue(): number {
    return this.value;
  }

  increment(): TodoOrder {
    return new TodoOrder(this.value + 1);
  }

  decrement(): TodoOrder {
    return new TodoOrder(Math.max(0, this.value - 1));
  }

  equals(other: TodoOrder): boolean {
    return this.value === other.value;
  }

  isGreaterThan(other: TodoOrder): boolean {
    return this.value > other.value;
  }

  isLessThan(other: TodoOrder): boolean {
    return this.value < other.value;
  }

  toString(): string {
    return this.value.toString();
  }
}