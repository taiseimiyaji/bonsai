import { PrismaClient, Todo as PrismaTodo, TodoCategory as PrismaTodoCategory } from '@prisma/client';
import { Todo, TodoCategory } from '../../domain/entities';
import {
  TodoId,
  TodoTitle,
  TodoStatus,
  TodoPriority,
  UserId,
  TodoOrder,
} from '../../domain/value-objects';
import {
  ITodoRepository,
  TodoSearchCriteria,
  TodoSortCriteria,
} from '../../domain/repositories';

type PrismaTodoWithRelations = PrismaTodo & {
  category?: PrismaTodoCategory | null;
  subTasks?: PrismaTodoWithRelations[];
  parent?: PrismaTodoWithRelations | null;
};

/**
 * PrismaによるTodoリポジトリの実装
 */
export class PrismaTodoRepository implements ITodoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: TodoId): Promise<Todo | null> {
    const prismaTodo = await this.prisma.todo.findUnique({
      where: { id: id.getValue() },
      include: {
        category: true,
        subTasks: {
          include: {
            category: true,
            subTasks: true,
          },
          orderBy: { order: 'asc' },
        },
        parent: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!prismaTodo) {
      return null;
    }

    return this.toDomainEntity(prismaTodo);
  }

  async findByCriteria(
    criteria: TodoSearchCriteria,
    sort?: TodoSortCriteria
  ): Promise<Todo[]> {
    const where: any = {
      userId: criteria.userId.getValue(),
      archived: criteria.archived ?? false,
    };

    if (criteria.status) {
      where.status = criteria.status.getValue();
    }

    if (criteria.priority) {
      where.priority = criteria.priority.getValue();
    }

    if (criteria.categoryId) {
      where.categoryId = criteria.categoryId;
    }

    if (criteria.dueDate) {
      where.dueDate = {};
      if (criteria.dueDate.from) {
        where.dueDate.gte = criteria.dueDate.from;
      }
      if (criteria.dueDate.to) {
        where.dueDate.lte = criteria.dueDate.to;
      }
    }

    if (criteria.search) {
      where.OR = [
        { title: { contains: criteria.search, mode: 'insensitive' } },
        { description: { contains: criteria.search, mode: 'insensitive' } },
      ];
    }

    if (criteria.parentId !== undefined) {
      where.parentId = criteria.parentId?.getValue() || null;
    }

    // ソート条件
    let orderBy: any;
    if (sort) {
      orderBy = { [sort.field]: sort.direction };
    } else {
      orderBy = [{ order: 'asc' }, { createdAt: 'desc' }];
    }

    const prismaTodos = await this.prisma.todo.findMany({
      where,
      orderBy,
      include: {
        category: true,
        subTasks: {
          include: {
            category: true,
            subTasks: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return prismaTodos.map(todo => this.toDomainEntity(todo));
  }

  async findArchived(userId: UserId): Promise<Todo[]> {
    const prismaTodos = await this.prisma.todo.findMany({
      where: {
        userId: userId.getValue(),
        archived: true,
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        category: true,
        subTasks: {
          include: {
            category: true,
            subTasks: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return prismaTodos.map(todo => this.toDomainEntity(todo));
  }

  async save(todo: Todo): Promise<Todo> {
    const data = {
      id: todo.getId().getValue(),
      title: todo.getTitle().getValue(),
      description: todo.getDescription(),
      completed: todo.isCompleted(),
      archived: todo.isArchived(),
      userId: todo.getUserId().getValue(),
      dueDate: todo.getDueDate(),
      priority: todo.getPriority().getValue(),
      status: todo.getStatus().getValue(),
      order: todo.getOrder().getValue(),
      categoryId: todo.getCategoryId(),
      parentId: todo.getParentId()?.getValue() || null,
      createdAt: todo.getCreatedAt(),
      updatedAt: todo.getUpdatedAt(),
    };

    const savedTodo = await this.prisma.todo.upsert({
      where: { id: data.id },
      update: data,
      create: data,
      include: {
        category: true,
        subTasks: {
          include: {
            category: true,
            subTasks: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return this.toDomainEntity(savedTodo);
  }

  async delete(id: TodoId): Promise<void> {
    await this.prisma.todo.delete({
      where: { id: id.getValue() },
    });
  }

  async deleteMany(ids: TodoId[]): Promise<void> {
    await this.prisma.todo.deleteMany({
      where: {
        id: { in: ids.map(id => id.getValue()) },
      },
    });
  }

  async getMaxOrder(userId: UserId, parentId: TodoId | null): Promise<number> {
    const result = await this.prisma.todo.findFirst({
      where: {
        userId: userId.getValue(),
        parentId: parentId?.getValue() || null,
      },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return result?.order ?? -1;
  }

  nextId(): TodoId {
    // UUIDv4を生成
    return new TodoId(crypto.randomUUID());
  }

  /**
   * PrismaのTodoエンティティをドメインエンティティに変換
   */
  private toDomainEntity(prismaTodo: PrismaTodoWithRelations): Todo {
    const todo = new Todo(
      new TodoId(prismaTodo.id),
      new TodoTitle(prismaTodo.title),
      prismaTodo.description,
      prismaTodo.completed,
      prismaTodo.archived,
      new UserId(prismaTodo.userId),
      prismaTodo.dueDate,
      TodoPriority.fromString(prismaTodo.priority),
      TodoStatus.fromString(prismaTodo.status),
      new TodoOrder(prismaTodo.order),
      prismaTodo.categoryId,
      prismaTodo.parentId ? new TodoId(prismaTodo.parentId) : null,
      prismaTodo.createdAt,
      prismaTodo.updatedAt,
      prismaTodo.category ? this.toCategoryEntity(prismaTodo.category) : null,
      prismaTodo.parent ? this.toDomainEntity(prismaTodo.parent) : null
    );

    // サブタスクを追加
    if (prismaTodo.subTasks) {
      prismaTodo.subTasks.forEach(subTask => {
        todo.addSubTask(this.toDomainEntity(subTask));
      });
    }

    return todo;
  }

  /**
   * PrismaのTodoCategoryエンティティをドメインエンティティに変換
   */
  private toCategoryEntity(prismaCategory: PrismaTodoCategory): TodoCategory {
    return new TodoCategory(
      prismaCategory.id,
      prismaCategory.name,
      prismaCategory.color,
      new UserId(prismaCategory.userId),
      prismaCategory.createdAt,
      prismaCategory.updatedAt
    );
  }
}