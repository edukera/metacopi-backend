// import { Test, TestingModule } from '@nestjs/testing';
// import { UserController } from './user.controller';
// import { UserService } from './user.service';
// import { User, CreateUserDto, UpdateUserDto } from './user.interface';
// import { NotFoundException, ConflictException } from '@nestjs/common';
// import { UserRole } from './user.schema';

// describe('UserController', () => {
//   let controller: UserController;
//   let service: UserService;

//   const mockUser: User = {
//     id: 'user-id-1',
//     email: 'test@example.com',
//     password: 'hashed_password',
//     firstName: 'Test',
//     lastName: 'User',
//     role: UserRole.USER,
//     emailVerified: false,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   };

//   const mockUsers: User[] = [
//     mockUser,
//     {
//       id: 'user-id-2',
//       email: 'teacher@example.com',
//       password: 'hashed_password',
//       firstName: 'Teacher',
//       lastName: 'User',
//       role: UserRole.USER,
//       emailVerified: true,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     },
//   ];

//   // Mock UserService
//   const mockUserService = {
//     findAll: jest.fn().mockResolvedValue(mockUsers),
//     findById: jest.fn().mockImplementation((id: string) => {
//       const user = mockUsers.find(u => u.id === id);
//       if (!user) {
//         throw new NotFoundException(`User with ID ${id} not found`);
//       }
//       return Promise.resolve(user);
//     }),
//     create: jest.fn().mockImplementation((dto: CreateUserDto) => {
//       const newUser = {
//         id: 'new-user-id',
//         ...dto,
//         emailVerified: false,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       };
//       return Promise.resolve(newUser as User);
//     }),
//     update: jest.fn().mockImplementation((id: string, dto: UpdateUserDto) => {
//       const userIndex = mockUsers.findIndex(u => u.id === id);
//       if (userIndex === -1) {
//         throw new NotFoundException(`User with ID ${id} not found`);
//       }
//       const updatedUser = { ...mockUsers[userIndex], ...dto, updatedAt: new Date() };
//       return Promise.resolve(updatedUser);
//     }),
//     delete: jest.fn().mockImplementation((id: string) => {
//       const userIndex = mockUsers.findIndex(u => u.id === id);
//       if (userIndex === -1) {
//         throw new NotFoundException(`User with ID ${id} not found`);
//       }
//       return Promise.resolve(true);
//     }),
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [UserController],
//       providers: [
//         {
//           provide: UserService,
//           useValue: mockUserService,
//         },
//       ],
//     }).compile();

//     controller = module.get<UserController>(UserController);
//     service = module.get<UserService>(UserService);

//     // Reset mock counters
//     jest.clearAllMocks();
//   });

//   it('should be defined', () => {
//     expect(controller).toBeDefined();
//   });

//   describe('findAll', () => {
//     it('should return an array of users', async () => {
//       const result = await controller.findAll();
//       expect(result).toEqual(mockUsers);
//       expect(service.findAll).toHaveBeenCalled();
//     });
//   });

//   describe('findById', () => {
//     it('should return a single user', async () => {
//       const result = await controller.findById(mockUser.id);
//       expect(result).toEqual(mockUser);
//       expect(service.findById).toHaveBeenCalledWith(mockUser.id);
//     });

//     it('should throw NotFoundException if user not found', async () => {
//       mockUserService.findById.mockRejectedValueOnce(new NotFoundException('User not found'));
//       await expect(controller.findById('nonexistent-id')).rejects.toThrow(NotFoundException);
//     });
//   });

//   describe('create', () => {
//     it('should create a new user', async () => {
//       const createUserDto: CreateUserDto = {
//         email: 'new@example.com',
//         password: 'password123',
//         firstName: 'New',
//         lastName: 'User',
//         role: UserRole.USER,
//       };

//       const result = await controller.create(createUserDto);
//       expect(result).toHaveProperty('id');
//       expect(result.email).toEqual(createUserDto.email);
//       expect(service.create).toHaveBeenCalledWith(createUserDto);
//     });

//     it('should throw ConflictException if email already exists', async () => {
//       const createUserDto: CreateUserDto = {
//         email: 'existing@example.com',
//         password: 'password123',
//         firstName: 'Existing',
//         lastName: 'User',
//         role: UserRole.USER,
//       };

//       mockUserService.create.mockRejectedValueOnce(
//         new ConflictException(`User with email ${createUserDto.email} already exists`)
//       );

//       await expect(controller.create(createUserDto)).rejects.toThrow(ConflictException);
//     });
//   });

//   describe('update', () => {
//     it('should update a user', async () => {
//       const updateUserDto: UpdateUserDto = {
//         firstName: 'Updated',
//         lastName: 'Name',
//       };

//       const result = await controller.update(mockUser.id, updateUserDto);
//       expect(result.firstName).toEqual(updateUserDto.firstName);
//       expect(result.lastName).toEqual(updateUserDto.lastName);
//       expect(service.update).toHaveBeenCalledWith(mockUser.id, updateUserDto);
//     });

//     it('should throw NotFoundException if user to update not found', async () => {
//       const updateUserDto: UpdateUserDto = {
//         firstName: 'Updated',
//       };

//       mockUserService.update.mockRejectedValueOnce(new NotFoundException('User not found'));

//       await expect(controller.update('nonexistent-id', updateUserDto)).rejects.toThrow(NotFoundException);
//     });
//   });

//   describe('delete', () => {
//     it('should delete a user', async () => {
//       await controller.delete(mockUser.id);
//       expect(service.delete).toHaveBeenCalledWith(mockUser.id);
//     });

//     it('should throw NotFoundException if user to delete not found', async () => {
//       mockUserService.delete.mockRejectedValueOnce(new NotFoundException('User not found'));
//       await expect(controller.delete('nonexistent-id')).rejects.toThrow(NotFoundException);
//     });
//   });
// }); 