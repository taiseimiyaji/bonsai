import { describe, it, expect } from 'vitest';
import { TodoTitle } from './todo-title.value-object';

describe('TodoTitle', () => {
  describe('constructor', () => {
    it('有効なタイトルで作成できる', () => {
      const title = new TodoTitle('テストタイトル');
      expect(title.getValue()).toBe('テストタイトル');
    });

    it('前後の空白を削除する', () => {
      const title = new TodoTitle('  テストタイトル  ');
      expect(title.getValue()).toBe('テストタイトル');
    });

    it('空のタイトルで作成できない', () => {
      expect(() => new TodoTitle('')).toThrow('タイトルは1文字以上である必要があります');
    });

    it('空白のみのタイトルで作成できない', () => {
      expect(() => new TodoTitle('   ')).toThrow('タイトルは1文字以上である必要があります');
    });

    it('255文字を超えるタイトルで作成できない', () => {
      const longTitle = 'a'.repeat(256);
      expect(() => new TodoTitle(longTitle)).toThrow('タイトルは255文字以下である必要があります');
    });
  });

  describe('equals', () => {
    it('同じ値の場合true', () => {
      const title1 = new TodoTitle('テスト');
      const title2 = new TodoTitle('テスト');
      expect(title1.equals(title2)).toBe(true);
    });

    it('異なる値の場合false', () => {
      const title1 = new TodoTitle('テスト1');
      const title2 = new TodoTitle('テスト2');
      expect(title1.equals(title2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('文字列として値を返す', () => {
      const title = new TodoTitle('テストタイトル');
      expect(title.toString()).toBe('テストタイトル');
    });
  });
});