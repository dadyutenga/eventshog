import { Logger } from '@nestjs/common';
import { Repository, DeepPartial, FindManyOptions, FindOneOptions, ObjectLiteral, SelectQueryBuilder, FindOptionsOrder } from 'typeorm';

export class BaseRepository<T extends ObjectLiteral> {
  protected readonly logger = new Logger(BaseRepository.name);

  constructor(public readonly repository: Repository<T>) { }

  createQueryBuilder(alias: string): SelectQueryBuilder<T> {
    return this.repository.createQueryBuilder(alias);
  }

  private getDefaultOrder(): FindOptionsOrder<T> {
    // Try to get the column name from the entity metadata
    const metadata = this.repository.metadata;
    const createdAtColumn = metadata.columns.find(col => 
      col.propertyName === 'createdAt' || col.propertyName === 'created_at'
    );

    if (createdAtColumn) {
      return { [createdAtColumn.propertyName]: 'DESC' } as unknown as FindOptionsOrder<T>;
    }

    // If no created_at column is found, return empty order
    return {} as FindOptionsOrder<T>;
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    const defaultOptions: FindManyOptions<T> = {
      order: this.getDefaultOrder(),
      ...options
    };
    return this.repository.find(defaultOptions);
  }

  async findOne(options: FindOneOptions<T>): Promise<T | undefined> {
    const result = await this.repository.findOne(options);
    return result === null ? undefined : result;
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async save(entity: T): Promise<T> {
    return this.repository.save(entity);
  }

  async update(id: string, data: DeepPartial<T>): Promise<T | undefined> {
    try {
        await this.repository.update(id, data as any);
        // After update, fetch the updated entity
        const result = await this.repository.findOne({ where: { id } as any });
       
        return result === null ? undefined : result;

    } catch (error) {
        throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async find(options: FindManyOptions<T>): Promise<T[]> {
    const defaultOptions: FindManyOptions<T> = {
      order: this.getDefaultOrder(),
      ...options
    };
    return this.repository.find(defaultOptions);
  }

  async findAndCount(options: any): Promise<[T[], number]> {
    const defaultOptions: FindManyOptions<T> = {
      order: this.getDefaultOrder(),
      ...options
    };
    return this.repository.findAndCount(defaultOptions);
  }
}