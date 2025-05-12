// import { Test, TestingModule } from '@nestjs/testing';
// import { ConflictException, NotFoundException } from '@nestjs/common';
// import { UserService } from './user.service';
// import { MongoUserRepository } from './user.repository';
// import { createUserDto, updateUserDto, userStub } from '../../../test/factories/user.factory';
// import * as bcrypt from 'bcrypt';

// // Mocker bcrypt
// jest.mock('bcrypt', () => ({
//   compare: jest.fn(),
// }));

// describe('UserService', () => {
//   let service: UserService;
//   let repository: jest.Mocked<MongoUserRepository>;

//   beforeEach(async () => {
//     // Create a mock for the repository
//     const mockRepository = {
//       findAll: jest.fn(),
//       findById: jest.fn(),
//       findByEmail: jest.fn(),
//       create: jest.fn(),
//       update: jest.fn(),
//       delete: jest.fn(),
//     };

//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         UserService,
//         {
//           provide: MongoUserRepository,
//           useValue: mockRepository,
//         },
//       ],
//     }).compile();

//     service = module.get<UserService>(UserService);
//     repository = module.get(MongoUserRepository);

//     // Reset the mocks
//     jest.clearAllMocks();
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });

//   describe('findAll', () => {
//     it('should return all users', async () => {
//       // Arrange
//       const users = [userStub(), userStub()];
//       repository.findAll.mockResolvedValue(users);

//       // Act
//       const result = await service.findAll();

//       // Assert
//       expect(repository.findAll).toHaveBeenCalled();
//       expect(result).toEqual(users);
//     });
//   });

//   describe('findById', () => {
//     it('should return a user by id', async () => {
//       // Arrange
//       const user = userStub();
//       repository.findById.mockResolvedValue(user);

//       // Act
//       const result = await service.findById(user.id);

//       // Assert
//       expect(repository.findById).toHaveBeenCalledWith(user.id);
//       expect(result).toEqual(user);
//     });

//     it('should throw NotFoundException if user is not found', async () => {
//       // Arrange
//       const userId = '1234567890abcdef12345678';
//       repository.findById.mockResolvedValue(null);

//       // Act & Assert
//       await expect(service.findById(userId)).rejects.toThrow(NotFoundException);
//       expect(repository.findById).toHaveBeenCalledWith(userId);
//     });
//   });

//   describe('findByEmail', () => {
//     it('should return a user by email', async () => {
//       // Arrange
//       const user = userStub();
//       repository.findByEmail.mockResolvedValue(user);

//       // Act
//       const result = await service.findByEmail(user.email);

//       // Assert
//       expect(repository.findByEmail).toHaveBeenCalledWith(user.email);
//       expect(result).toEqual(user);
//     });

//     it('should return null if user is not found by email', async () => {
//       // Arrange
//       const email = 'nonexistent@example.com';
//       repository.findByEmail.mockResolvedValue(null);

//       // Act
//       const result = await service.findByEmail(email);

//       // Assert
//       expect(repository.findByEmail).toHaveBeenCalledWith(email);
//       expect(result).toBeNull();
//     });
//   });

//   describe('create', () => {
//     it('should create a new user if email does not exist', async () => {
//       // Arrange
//       const dto = createUserDto();
//       const newUser = userStub({
//         email: dto.email,
//         firstName: dto.firstName,
//         lastName: dto.lastName,
//       });

//       repository.findByEmail.mockResolvedValue(null);
//       repository.create.mockResolvedValue(newUser);

//       // Act
//       const result = await service.create(dto);

//       // Assert
//       expect(repository.findByEmail).toHaveBeenCalledWith(dto.email);
//       expect(repository.create).toHaveBeenCalledWith(dto);
//       expect(result).toEqual(newUser);
//     });

//     it('should throw ConflictException if email already exists', async () => {
//       // Arrange
//       const dto = createUserDto();
//       const existingUser = userStub({ email: dto.email });

//       repository.findByEmail.mockResolvedValue(existingUser);

//       // Act & Assert
//       await expect(service.create(dto)).rejects.toThrow(ConflictException);
//       expect(repository.findByEmail).toHaveBeenCalledWith(dto.email);
//       expect(repository.create).not.toHaveBeenCalled();
//     });
//   });

//   describe('update', () => {
//     it('should update a user if it exists', async () => {
//       // Arrange
//       const userId = '1234567890abcdef12345678';
//       const dto = updateUserDto({ firstName: 'Updated' });
//       const updatedUser = userStub({ id: userId, firstName: 'Updated' });

//       repository.update.mockResolvedValue(updatedUser);

//       // Act
//       const result = await service.update(userId, dto);

//       // Assert
//       expect(repository.update).toHaveBeenCalledWith(userId, dto);
//       expect(result).toEqual(updatedUser);
//     });

//     it('should throw NotFoundException if user to update does not exist', async () => {
//       // Arrange
//       const userId = '1234567890abcdef12345678';
//       const dto = updateUserDto({ firstName: 'Updated' });

//       repository.update.mockResolvedValue(null);

//       // Act & Assert
//       await expect(service.update(userId, dto)).rejects.toThrow(NotFoundException);
//       expect(repository.update).toHaveBeenCalledWith(userId, dto);
//     });
//   });

//   describe('delete', () => {
//     it('should delete a user if it exists', async () => {
//       // Arrange
//       const userId = '1234567890abcdef12345678';
//       repository.delete.mockResolvedValue(true);

//       // Act
//       const result = await service.delete(userId);

//       // Assert
//       expect(repository.delete).toHaveBeenCalledWith(userId);
//       expect(result).toBe(true);
//     });

//     it('should throw NotFoundException if user to delete does not exist', async () => {
//       // Arrange
//       const userId = '1234567890abcdef12345678';
//       repository.delete.mockResolvedValue(false);

//       // Act & Assert
//       await expect(service.delete(userId)).rejects.toThrow(NotFoundException);
//       expect(repository.delete).toHaveBeenCalledWith(userId);
//     });
//   });

//   describe('comparePasswords', () => {
//     it('should call bcrypt.compare and return the result', async () => {
//       // Arrange
//       const plainTextPassword = 'password123';
//       const hashedPassword = 'hashed_password';
//       (bcrypt.compare as jest.Mock).mockResolvedValue(true);

//       // Act
//       const result = await service.comparePasswords(plainTextPassword, hashedPassword);

//       // Assert
//       expect(bcrypt.compare).toHaveBeenCalledWith(plainTextPassword, hashedPassword);
//       expect(result).toBe(true);
//     });

//     it('should return false when passwords do not match', async () => {
//       // Arrange
//       const plainTextPassword = 'wrong_password';
//       const hashedPassword = 'hashed_password';
//       (bcrypt.compare as jest.Mock).mockResolvedValue(false);

//       // Act
//       const result = await service.comparePasswords(plainTextPassword, hashedPassword);

//       // Assert
//       expect(bcrypt.compare).toHaveBeenCalledWith(plainTextPassword, hashedPassword);
//       expect(result).toBe(false);
//     });
//   });
// }); 