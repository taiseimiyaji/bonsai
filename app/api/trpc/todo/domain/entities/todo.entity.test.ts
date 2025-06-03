import { describe, it, expect, beforeEach } from 'vitest';
import { Todo } from './todo.entity';
import {
  TodoId,
  TodoTitle,
  TodoStatus,
  TodoPriority,
  UserId,
  TodoOrder,
} from '../value-objects';

describe('Todo Entity', () => {
  let todo: Todo;
  const todoId = new TodoId('test-todo-id');
  const userId = new UserId('test-user-id');

  beforeEach(() => {
    todo = new Todo(
      todoId,
      new TodoTitle('テストタスク'),
      '説明文',
      false,
      false,
      userId,
      null,
      TodoPriority.medium(),
      TodoStatus.todo(),
      new TodoOrder(0),
      null,
      null,
      new Date(),
      new Date()
    );
  });

  describe('constructor', () => {
    it('完了済みタスクのステータスがDONE以外の場合エラー', () => {
      expect(() => new Todo(
        todoId,
        new TodoTitle('テスト'),
        null,
        true, // completed
        false,
        userId,
        null,
        TodoPriority.medium(),
        TodoStatus.todo(), // DONEでない
        new TodoOrder(0),
        null,
        null,
        new Date(),
        new Date()
      )).toThrow('完了済みタスクのステータスはDONEである必要があります');
    });

    it('未完了タスクのステータスがDONEの場合エラー', () => {
      expect(() => new Todo(
        todoId,
        new TodoTitle('テスト'),
        null,
        false, // not completed
        false,
        userId,
        null,
        TodoPriority.medium(),
        TodoStatus.done(), // DONE
        new TodoOrder(0),
        null,
        null,
        new Date(),
        new Date()
      )).toThrow('未完了タスクのステータスはDONEにできません');
    });
  });

  describe('updateTitle', () => {
    it('タイトルを更新できる', () => {
      const newTitle = new TodoTitle('新しいタイトル');
      todo.updateTitle(newTitle);
      expect(todo.getTitle().getValue()).toBe('新しいタイトル');
    });

    it('アーカイブされたタスクは更新できない', () => {
      todo.complete();
      todo.archive();
      expect(() => todo.updateTitle(new TodoTitle('新タイトル'))).toThrow('アーカイブされたタスクは編集できません');
    });
  });

  describe('complete/uncomplete', () => {
    it('タスクを完了にできる', () => {
      todo.complete();
      expect(todo.isCompleted()).toBe(true);
      expect(todo.getStatus().isDone()).toBe(true);
    });

    it('タスクを未完了に戻せる', () => {
      todo.complete();
      todo.uncomplete();
      expect(todo.isCompleted()).toBe(false);
      expect(todo.getStatus().isTodo()).toBe(true);
    });
  });

  describe('changeStatus', () => {
    it('ステータスをIN_PROGRESSに変更できる', () => {
      todo.changeStatus(TodoStatus.inProgress());
      expect(todo.getStatus().isInProgress()).toBe(true);
      expect(todo.isCompleted()).toBe(false);
    });

    it('ステータスをDONEに変更すると自動的にcompletedになる', () => {
      todo.changeStatus(TodoStatus.done());
      expect(todo.getStatus().isDone()).toBe(true);
      expect(todo.isCompleted()).toBe(true);
    });

    it('DONEから他のステータスに変更すると自動的に未完了になる', () => {
      todo.complete();
      todo.changeStatus(TodoStatus.todo());
      expect(todo.getStatus().isTodo()).toBe(true);
      expect(todo.isCompleted()).toBe(false);
    });
  });

  describe('archive/unarchive', () => {
    it('完了済みタスクをアーカイブできる', () => {
      todo.complete();
      todo.archive();
      expect(todo.isArchived()).toBe(true);
    });

    it('未完了タスクはアーカイブできない', () => {
      expect(() => todo.archive()).toThrow('未完了のタスクはアーカイブできません');
    });

    it('アーカイブを解除できる', () => {
      todo.complete();
      todo.archive();
      todo.unarchive();
      expect(todo.isArchived()).toBe(false);
    });
  });

  describe('期限判定', () => {
    it('期限切れかどうか判定できる', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      todo.setDueDate(yesterday);
      expect(todo.isOverdue()).toBe(true);
    });

    it('完了済みタスクは期限切れにならない', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      todo.setDueDate(yesterday);
      todo.complete();
      expect(todo.isOverdue()).toBe(false);
    });

    it('今日が期限かどうか判定できる', () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      
      todo.setDueDate(today);
      expect(todo.isDueToday()).toBe(true);
    });
  });

  describe('サブタスク管理', () => {
    it('サブタスクを追加できる', () => {
      const subTask = new Todo(
        new TodoId('sub-task-id'),
        new TodoTitle('サブタスク'),
        null,
        false,
        false,
        userId,
        null,
        TodoPriority.low(),
        TodoStatus.todo(),
        new TodoOrder(0),
        null,
        todoId,
        new Date(),
        new Date()
      );

      todo.addSubTask(subTask);
      expect(todo.getSubTasks()).toHaveLength(1);
      expect(todo.getSubTasks()[0].getId().getValue()).toBe('sub-task-id');
    });

    it('異なるユーザーのタスクはサブタスクにできない', () => {
      const otherUserId = new UserId('other-user-id');
      const subTask = new Todo(
        new TodoId('sub-task-id'),
        new TodoTitle('サブタスク'),
        null,
        false,
        false,
        otherUserId,
        null,
        TodoPriority.low(),
        TodoStatus.todo(),
        new TodoOrder(0),
        null,
        todoId,
        new Date(),
        new Date()
      );

      expect(() => todo.addSubTask(subTask)).toThrow('異なるユーザーのタスクをサブタスクにすることはできません');
    });
  });
});