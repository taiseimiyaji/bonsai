import { PrismaClient } from '@prisma/client';
import { PrismaTodoRepository, PrismaTodoCategoryRepository } from './repositories';
import { TodoDomainService, TodoCategoryDomainService } from '../domain/services';
import {
  CreateTodoUseCase,
  UpdateTodoUseCase,
  DeleteTodoUseCase,
  GetTodosUseCase,
  GetTodoByIdUseCase,
  ArchiveTodoUseCase,
  UnarchiveTodoUseCase,
  ArchiveCompletedTodosUseCase,
  GetArchivedTodosUseCase,
  UpdateTodoOrderUseCase,
  UpdateManyTodosStatusUseCase,
  DeleteCompletedTodosUseCase,
  CreateTodoCategoryUseCase,
  UpdateTodoCategoryUseCase,
  DeleteTodoCategoryUseCase,
  GetTodoCategoriesUseCase,
} from '../application/use-cases';

/**
 * 依存性注入コンテナ
 * 各層の依存関係を管理
 */
export class TodoContainer {
  private static instance: TodoContainer;
  
  // リポジトリ
  public readonly todoRepository: PrismaTodoRepository;
  public readonly todoCategoryRepository: PrismaTodoCategoryRepository;
  
  // ドメインサービス
  public readonly todoDomainService: TodoDomainService;
  public readonly todoCategoryDomainService: TodoCategoryDomainService;
  
  // ユースケース
  public readonly createTodoUseCase: CreateTodoUseCase;
  public readonly updateTodoUseCase: UpdateTodoUseCase;
  public readonly deleteTodoUseCase: DeleteTodoUseCase;
  public readonly getTodosUseCase: GetTodosUseCase;
  public readonly getTodoByIdUseCase: GetTodoByIdUseCase;
  public readonly archiveTodoUseCase: ArchiveTodoUseCase;
  public readonly unarchiveTodoUseCase: UnarchiveTodoUseCase;
  public readonly archiveCompletedTodosUseCase: ArchiveCompletedTodosUseCase;
  public readonly getArchivedTodosUseCase: GetArchivedTodosUseCase;
  public readonly updateTodoOrderUseCase: UpdateTodoOrderUseCase;
  public readonly updateManyTodosStatusUseCase: UpdateManyTodosStatusUseCase;
  public readonly deleteCompletedTodosUseCase: DeleteCompletedTodosUseCase;
  
  // カテゴリ関連ユースケース
  public readonly createTodoCategoryUseCase: CreateTodoCategoryUseCase;
  public readonly updateTodoCategoryUseCase: UpdateTodoCategoryUseCase;
  public readonly deleteTodoCategoryUseCase: DeleteTodoCategoryUseCase;
  public readonly getTodoCategoriesUseCase: GetTodoCategoriesUseCase;

  private constructor(prisma: PrismaClient) {
    // リポジトリの初期化
    this.todoRepository = new PrismaTodoRepository(prisma);
    this.todoCategoryRepository = new PrismaTodoCategoryRepository(prisma);
    
    // ドメインサービスの初期化
    this.todoDomainService = new TodoDomainService(this.todoRepository);
    this.todoCategoryDomainService = new TodoCategoryDomainService(
      this.todoCategoryRepository,
      this.todoRepository
    );
    
    // ユースケースの初期化
    this.createTodoUseCase = new CreateTodoUseCase(
      this.todoRepository,
      this.todoDomainService
    );
    this.updateTodoUseCase = new UpdateTodoUseCase(this.todoRepository);
    this.deleteTodoUseCase = new DeleteTodoUseCase(
      this.todoRepository,
      this.todoDomainService
    );
    this.getTodosUseCase = new GetTodosUseCase(this.todoRepository);
    this.getTodoByIdUseCase = new GetTodoByIdUseCase(this.todoRepository);
    this.archiveTodoUseCase = new ArchiveTodoUseCase(this.todoRepository);
    this.unarchiveTodoUseCase = new UnarchiveTodoUseCase(this.todoRepository);
    this.archiveCompletedTodosUseCase = new ArchiveCompletedTodosUseCase(
      this.todoRepository,
      this.todoDomainService
    );
    this.getArchivedTodosUseCase = new GetArchivedTodosUseCase(this.todoRepository);
    this.updateTodoOrderUseCase = new UpdateTodoOrderUseCase(
      this.todoRepository,
      this.todoDomainService
    );
    this.updateManyTodosStatusUseCase = new UpdateManyTodosStatusUseCase(
      this.todoRepository
    );
    this.deleteCompletedTodosUseCase = new DeleteCompletedTodosUseCase(
      this.todoRepository,
      this.todoDomainService
    );
    
    // カテゴリ関連ユースケース
    this.createTodoCategoryUseCase = new CreateTodoCategoryUseCase(
      this.todoCategoryRepository,
      this.todoCategoryDomainService
    );
    this.updateTodoCategoryUseCase = new UpdateTodoCategoryUseCase(
      this.todoCategoryRepository,
      this.todoCategoryDomainService
    );
    this.deleteTodoCategoryUseCase = new DeleteTodoCategoryUseCase(
      this.todoCategoryRepository,
      this.todoRepository,
      this.todoCategoryDomainService
    );
    this.getTodoCategoriesUseCase = new GetTodoCategoriesUseCase(
      this.todoCategoryRepository
    );
  }

  static getInstance(prisma: PrismaClient): TodoContainer {
    if (!TodoContainer.instance) {
      TodoContainer.instance = new TodoContainer(prisma);
    }
    return TodoContainer.instance;
  }
}