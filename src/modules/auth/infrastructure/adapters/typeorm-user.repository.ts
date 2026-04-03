import type { DataSource, Repository } from "typeorm";
import type { UserRepositoryPort } from "../../domain/ports/user.repository.port";
import type { User } from "../../domain/entities/user.entity";
import { UserTypeormEntity } from "../entities/user.typeorm-entity";
import { UserMapper } from "../mappers/user.mapper";

export class TypeormUserRepository implements UserRepositoryPort {
  private readonly repo: Repository<UserTypeormEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(UserTypeormEntity);
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repo.findOneBy({ email });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    await this.repo.save(data);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
