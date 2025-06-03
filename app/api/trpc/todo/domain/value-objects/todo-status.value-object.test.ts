import { describe, it, expect } from 'vitest';
import { TodoStatus, TodoStatusValue } from './todo-status.value-object';

describe('TodoStatus', () => {
  describe('constructor', () => {
    it('各ステータスで作成できる', () => {
      const todoStatus = new TodoStatus(TodoStatusValue.TODO);
      const inProgressStatus = new TodoStatus(TodoStatusValue.IN_PROGRESS);
      const doneStatus = new TodoStatus(TodoStatusValue.DONE);

      expect(todoStatus.getValue()).toBe(TodoStatusValue.TODO);
      expect(inProgressStatus.getValue()).toBe(TodoStatusValue.IN_PROGRESS);
      expect(doneStatus.getValue()).toBe(TodoStatusValue.DONE);
    });
  });

  describe('ステータス判定メソッド', () => {
    it('isTodoが正しく動作する', () => {
      const todoStatus = new TodoStatus(TodoStatusValue.TODO);
      const doneStatus = new TodoStatus(TodoStatusValue.DONE);

      expect(todoStatus.isTodo()).toBe(true);
      expect(doneStatus.isTodo()).toBe(false);
    });

    it('isInProgressが正しく動作する', () => {
      const inProgressStatus = new TodoStatus(TodoStatusValue.IN_PROGRESS);
      const todoStatus = new TodoStatus(TodoStatusValue.TODO);

      expect(inProgressStatus.isInProgress()).toBe(true);
      expect(todoStatus.isInProgress()).toBe(false);
    });

    it('isDoneが正しく動作する', () => {
      const doneStatus = new TodoStatus(TodoStatusValue.DONE);
      const todoStatus = new TodoStatus(TodoStatusValue.TODO);

      expect(doneStatus.isDone()).toBe(true);
      expect(todoStatus.isDone()).toBe(false);
    });
  });

  describe('fromString', () => {
    it('有効な文字列からステータスを作成できる', () => {
      const status = TodoStatus.fromString('TODO');
      expect(status.getValue()).toBe(TodoStatusValue.TODO);
    });

    it('無効な文字列でエラーを投げる', () => {
      expect(() => TodoStatus.fromString('INVALID')).toThrow('不正なステータス値: INVALID');
    });
  });

  describe('ファクトリメソッド', () => {
    it('todo()でTODOステータスを作成', () => {
      const status = TodoStatus.todo();
      expect(status.getValue()).toBe(TodoStatusValue.TODO);
    });

    it('inProgress()でIN_PROGRESSステータスを作成', () => {
      const status = TodoStatus.inProgress();
      expect(status.getValue()).toBe(TodoStatusValue.IN_PROGRESS);
    });

    it('done()でDONEステータスを作成', () => {
      const status = TodoStatus.done();
      expect(status.getValue()).toBe(TodoStatusValue.DONE);
    });
  });

  describe('equals', () => {
    it('同じステータスの場合true', () => {
      const status1 = TodoStatus.todo();
      const status2 = TodoStatus.todo();
      expect(status1.equals(status2)).toBe(true);
    });

    it('異なるステータスの場合false', () => {
      const status1 = TodoStatus.todo();
      const status2 = TodoStatus.done();
      expect(status1.equals(status2)).toBe(false);
    });
  });
});