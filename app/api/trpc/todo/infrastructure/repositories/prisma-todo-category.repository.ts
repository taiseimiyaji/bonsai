import { PrismaClient } from '@prisma/client';
import { TodoCategory } from '../../domain/entities';
import { UserId } from '../../domain/value-objects';
import { ITodoCategoryRepository } from '../../domain/repositories';

/**
 * PrismaによるTodoCategoryリポジトリの実装
 */
export class PrismaTodoCategoryRepository implements ITodoCategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<TodoCategory | null> {
    const prismaCategory = await this.prisma.todoCategory.findUnique({
      where: { id },
    });

    if (!prismaCategory) {
      return null;
    }

    return this.toDomainEntity(prismaCategory);
  }

  async findByUserId(userId: UserId): Promise<TodoCategory[]> {
    const prismaCategories = await this.prisma.todoCategory.findMany({
      where: { userId: userId.getValue() },
      orderBy: { name: 'asc' },
    });

    return prismaCategories.map(category => this.toDomainEntity(category));
  }

  async save(category: TodoCategory): Promise<TodoCategory> {
    const data = {
      id: category.getId(),
      name: category.getName(),
      color: category.getColor(),
      userId: category.getUserId().getValue(),
      createdAt: category.getCreatedAt(),
      updatedAt: category.getUpdatedAt(),
    };

    const savedCategory = await this.prisma.todoCategory.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });

    return this.toDomainEntity(savedCategory);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.todoCategory.delete({
      where: { id },
    });
  }

  async countTodosByCategory(categoryId: string): Promise<number> {
    return await this.prisma.todo.count({
      where: { categoryId },
    });
  }

  nextId(): string {
    // UUIDv4を生成
    return crypto.randomUUID();
  }

  /**
   * PrismaのTodoCategoryエンティティをドメインエンティティに変換
   */
  private toDomainEntity(prismaCategory: any): TodoCategory {
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