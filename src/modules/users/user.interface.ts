import { UserRole } from './user.schema';

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  emailVerified: boolean;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  password?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
  role?: UserRole;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(createUserDto: CreateUserDto): Promise<User>;
  update(id: string, updateUserDto: UpdateUserDto): Promise<User | null>;
  updateByEmail(email: string, updateUserDto: UpdateUserDto): Promise<User | null>;
  delete(id: string): Promise<boolean>;
  deleteByEmail(email: string): Promise<boolean>;
} 