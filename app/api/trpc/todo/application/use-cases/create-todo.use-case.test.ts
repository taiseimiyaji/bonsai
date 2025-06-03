import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateTodoUseCase } from './create-todo.use-case';
import { ITodoRepository } from '../../domain/repositories';
import { TodoDomainService } from '../../domain/services';
import { TodoId, TodoOrder, UserId } from '../../domain/value-objects';
import { CreateTodoDto } from '../dtos';

describe('CreateTodoUseCase', () => {
  let mockTodoRepository: ITodoRepository;
  let mockTodoDomainService: TodoDomainService;
  let useCase: CreateTodoUseCase;

  beforeEach(() => {
    // モックリポジトリの作成
    mockTodoRepository = {
      findById: vi.fn(),
      findByCriteria: vi.fn(),
      findArchived: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      getMaxOrder: vi.fn(),
      nextId: vi.fn(() => new TodoId('new-todo-id')),
    };

    // モックドメインサービスの作成
    mockTodoDomainService = {
      deleteWithSubTasks: vi.fn(),
      archiveCompletedTodos: vi.fn(),
      reorderTasks: vi.fn(),
      calculateNewTaskOrder: vi.fn(() => Promise.resolve(new TodoOrder(0))),
    } as any;

    useCase = new CreateTodoUseCase(mockTodoRepository, mockTodoDomainService);
  });

  it('新しいTodoを作成できる', async () => {
    const createDto: CreateTodoDto = {
      title: '新しいタスク',
      description: 'タスクの説明',
      dueDate: new Date('2024-12-31'),
      priority: 'HIGH',
      status: 'TODO',
      categoryId: 'category-123',
      parentId: null,
    };

    const userId = 'user-123';

    // モックの設定
    vi.mocked(mockTodoRepository.save).mockImplementation(async (todo) => todo);

    // 実行
    const result = await useCase.execute(createDto, userId);

    // 検証
    expect(result).toBeDefined();
    expect(result.id).toBe('new-todo-id');
    expect(result.title).toBe('新しいタスク');
    expect(result.description).toBe('タスクの説明');
    expect(result.priority).toBe('HIGH');
    expect(result.status).toBe('TODO');
    expect(result.userId).toBe(userId);

    // モックが正しく呼ばれたか確認
    expect(mockTodoDomainService.calculateNewTaskOrder).toHaveBeenCalledWith(
      expect.any(UserId),
      null
    );
    expect(mockTodoRepository.save).toHaveBeenCalledTimes(1);
  });

  it('親タスクIDを指定してサブタスクを作成できる', async () => {
    const createDto: CreateTodoDto = {
      title: 'サブタスク',
      priority: 'MEDIUM',
      status: 'TODO',
      parentId: 'parent-todo-id',
    };

    const userId = 'user-123';

    // モックの設定
    vi.mocked(mockTodoRepository.save).mockImplementation(async (todo) => todo);

    // 実行
    const result = await useCase.execute(createDto, userId);

    // 検証
    expect(result.parentId).toBe('parent-todo-id');

    // calculateNewTaskOrderが親タスクIDと共に呼ばれたことを確認
    expect(mockTodoDomainService.calculateNewTaskOrder).toHaveBeenCalledWith(
      expect.any(UserId),
      expect.objectContaining({ getValue: expect.any(Function) })
    );
  });

  it('最小限の情報でTodoを作成できる', async () => {
    const createDto: CreateTodoDto = {
      title: 'シンプルなタスク',
      priority: 'MEDIUM',
      status: 'TODO',
    };

    const userId = 'user-123';

    // モックの設定
    vi.mocked(mockTodoRepository.save).mockImplementation(async (todo) => todo);

    // 実行
    const result = await useCase.execute(createDto, userId);

    // 検証
    expect(result.title).toBe('シンプルなタスク');
    expect(result.description).toBeNull();
    expect(result.dueDate).toBeNull();
    expect(result.categoryId).toBeNull();
    expect(result.parentId).toBeNull();
  });
});