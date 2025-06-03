import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateTodoUseCase } from './update-todo.use-case';
import { ITodoRepository } from '../../domain/repositories';
import { Todo } from '../../domain/entities';
import {
  TodoId,
  TodoTitle,
  TodoStatus,
  TodoPriority,
  UserId,
  TodoOrder,
} from '../../domain/value-objects';
import { UpdateTodoDto } from '../dtos';

describe('UpdateTodoUseCase', () => {
  let mockTodoRepository: ITodoRepository;
  let useCase: UpdateTodoUseCase;
  let existingTodo: Todo;

  beforeEach(() => {
    // 既存のTodoエンティティを作成
    existingTodo = new Todo(
      new TodoId('todo-123'),
      new TodoTitle('既存のタスク'),
      '既存の説明',
      false,
      false,
      new UserId('user-123'),
      null,
      TodoPriority.medium(),
      TodoStatus.todo(),
      new TodoOrder(0),
      null,
      null,
      new Date('2024-01-01'),
      new Date('2024-01-01')
    );

    // モックリポジトリの作成
    mockTodoRepository = {
      findById: vi.fn(async () => existingTodo),
      findByCriteria: vi.fn(),
      findArchived: vi.fn(),
      save: vi.fn(async (todo) => todo),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      getMaxOrder: vi.fn(),
      nextId: vi.fn(),
    };

    useCase = new UpdateTodoUseCase(mockTodoRepository);
  });

  it('Todoのタイトルを更新できる', async () => {
    const updateDto: UpdateTodoDto = {
      title: '更新されたタスク',
    };

    const result = await useCase.execute('todo-123', updateDto, 'user-123');

    expect(result.title).toBe('更新されたタスク');
    expect(mockTodoRepository.save).toHaveBeenCalledTimes(1);
  });

  it('Todoの複数フィールドを同時に更新できる', async () => {
    const updateDto: UpdateTodoDto = {
      title: '更新タイトル',
      description: '更新説明',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: new Date('2024-12-31'),
    };

    const result = await useCase.execute('todo-123', updateDto, 'user-123');

    expect(result.title).toBe('更新タイトル');
    expect(result.description).toBe('更新説明');
    expect(result.priority).toBe('HIGH');
    expect(result.status).toBe('IN_PROGRESS');
    expect(result.dueDate).toEqual(new Date('2024-12-31'));
  });

  it('completedをtrueにするとstatusがDONEになる', async () => {
    const updateDto: UpdateTodoDto = {
      completed: true,
    };

    const result = await useCase.execute('todo-123', updateDto, 'user-123');

    expect(result.completed).toBe(true);
    expect(result.status).toBe('DONE');
  });

  it('completedをfalseにするとstatusがTODOになる', async () => {
    // 既存のTodoを完了状態にする
    existingTodo.complete();

    const updateDto: UpdateTodoDto = {
      completed: false,
    };

    const result = await useCase.execute('todo-123', updateDto, 'user-123');

    expect(result.completed).toBe(false);
    expect(result.status).toBe('TODO');
  });

  it('存在しないTodoを更新しようとするとエラー', async () => {
    vi.mocked(mockTodoRepository.findById).mockResolvedValueOnce(null);

    const updateDto: UpdateTodoDto = {
      title: '更新',
    };

    await expect(useCase.execute('not-found', updateDto, 'user-123'))
      .rejects.toThrow('Todoが見つかりません');
  });

  it('他のユーザーのTodoを更新しようとするとエラー', async () => {
    const updateDto: UpdateTodoDto = {
      title: '更新',
    };

    await expect(useCase.execute('todo-123', updateDto, 'other-user'))
      .rejects.toThrow('他のユーザーのTodoは更新できません');
  });

  it('カテゴリIDを更新できる', async () => {
    const updateDto: UpdateTodoDto = {
      categoryId: 'new-category-id',
    };

    const result = await useCase.execute('todo-123', updateDto, 'user-123');

    expect(result.categoryId).toBe('new-category-id');
  });

  it('親タスクIDを更新できる', async () => {
    const updateDto: UpdateTodoDto = {
      parentId: 'parent-todo-id',
    };

    const result = await useCase.execute('todo-123', updateDto, 'user-123');

    expect(result.parentId).toBe('parent-todo-id');
  });
});