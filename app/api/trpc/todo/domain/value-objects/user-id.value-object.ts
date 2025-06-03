/**
 * UserId値オブジェクト
 * ユーザーのIDを表現する値オブジェクト
 */
export class UserId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('UserIdは空にできません');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}