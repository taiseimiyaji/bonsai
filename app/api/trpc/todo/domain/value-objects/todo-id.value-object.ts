/**
 * TodoId値オブジェクト
 * TodoのIDを表現する値オブジェクト
 */
export class TodoId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('TodoIdは空にできません');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: TodoId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}