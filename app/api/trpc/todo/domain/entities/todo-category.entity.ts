import { UserId } from '../value-objects';

/**
 * TodoCategoryエンティティ
 * Todoのカテゴリを表現するエンティティ
 */
export class TodoCategory {
  constructor(
    private readonly id: string,
    private name: string,
    private color: string,
    private readonly userId: UserId,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {
    this.validateName(name);
    this.validateColor(color);
  }

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('カテゴリ名は必須です');
    }
    if (name.length > 50) {
      throw new Error('カテゴリ名は50文字以下である必要があります');
    }
  }

  private validateColor(color: string): void {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(color)) {
      throw new Error('カラーコードは有効な16進数形式である必要があります');
    }
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getColor(): string {
    return this.color;
  }

  getUserId(): UserId {
    return this.userId;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  updateName(name: string): void {
    this.validateName(name);
    this.name = name;
    this.updatedAt = new Date();
  }

  updateColor(color: string): void {
    this.validateColor(color);
    this.color = color;
    this.updatedAt = new Date();
  }

  equals(other: TodoCategory): boolean {
    return this.id === other.id;
  }
}