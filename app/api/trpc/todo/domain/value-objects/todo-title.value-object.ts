/**
 * TodoTitle値オブジェクト
 * Todoのタイトルを表現する値オブジェクト
 */
export class TodoTitle {
  private static readonly MIN_LENGTH = 1;
  private static readonly MAX_LENGTH = 255;

  constructor(private readonly value: string) {
    if (!value || value.trim().length < TodoTitle.MIN_LENGTH) {
      throw new Error(`タイトルは${TodoTitle.MIN_LENGTH}文字以上である必要があります`);
    }
    if (value.length > TodoTitle.MAX_LENGTH) {
      throw new Error(`タイトルは${TodoTitle.MAX_LENGTH}文字以下である必要があります`);
    }
    this.value = value.trim();
  }

  getValue(): string {
    return this.value;
  }

  equals(other: TodoTitle): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}