import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ClassService } from '../../src/modules/classes/class.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, connect, Model, Types } from 'mongoose';
import { Class, ClassSchema } from '../../src/modules/classes/class.schema';
import { CreateClassDto, UpdateClassDto } from '../../src/modules/classes/class.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MembershipService } from '../../src/modules/memberships/membership.service';
import { MembershipRole } from '../../src/modules/memberships/membership.schema';

describe('ClassService (Integration)', () => {
  let classService: ClassService;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let classModel: Model<Class>;
  let moduleRef: TestingModule;
  let mockMembershipService;

  const mockRequest = { 
    user: { 
      sub: new Types.ObjectId().toString(), 
      role: 'user' 
    } 
  };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;

    mockMembershipService = {
      create: jest.fn(),
      findByUser: jest.fn().mockResolvedValue([]),
      findByUserAndClass: jest.fn(),
      deleteByClass: jest.fn(),
    };

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([{ name: Class.name, schema: ClassSchema }]),
      ],
      providers: [
        ClassService,
        {
          provide: MembershipService,
          useValue: mockMembershipService,
        },
        {
          provide: 'REQUEST',
          useValue: mockRequest,
        },
      ],
    }).compile();

    classService = moduleRef.get<ClassService>(ClassService);
    classModel = mongoConnection.model(Class.name, ClassSchema);
  });

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
    
    if (mongoConnection) {
      await mongoConnection.dropDatabase();
      await mongoConnection.close(true);
    }
    
    if (mongod) {
      await mongod.stop();
    }
  });

  beforeEach(async () => {
    const collections = mongoConnection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
    
    // Reset mocks between tests
    mockMembershipService.findByUser.mockClear();
    mockMembershipService.create.mockClear();
  });

  describe('create', () => {
    it('should create a new class', async () => {
      const createClassDto: CreateClassDto = {
        id: 'CLS-2024-001',
        name: 'Test Class',
        description: 'Test Description',
        startDate: new Date(),
        endDate: new Date(),
        settings: { someKey: 'someValue' },
        createdByEmail: 'teacher@test.com',
      };

      const result = await classService.create(createClassDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(createClassDto.name);
      expect(result.description).toBe(createClassDto.description);
      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();
      expect(result.settings).toEqual(createClassDto.settings);
      expect(result.createdByEmail.toString()).toBe(mockRequest.user.sub);
      expect(result.code).toBeDefined();
      expect(result.archived).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return an array of classes', async () => {
      // Create classes in the database
      await classModel.create([
        {
          name: 'Class 1',
          description: 'Description 1',
          createdBy: new Types.ObjectId(mockRequest.user.sub),
          code: 'CODE1',
          settings: {},
          archived: false,
        },
        {
          name: 'Class 2',
          description: 'Description 2',
          createdBy: new Types.ObjectId(mockRequest.user.sub),
          code: 'CODE2',
          settings: {},
          archived: false,
        },
      ]);

      // Mock memberships to return classes for this user
      const classesCreated = await classModel.find().exec();
      mockMembershipService.findByUser.mockResolvedValue([
        { classId: classesCreated[0]._id.toString() },
        { classId: classesCreated[1]._id.toString() }
      ]);

      const classes = await classService.findAll(false);
      expect(classes).toBeDefined();
      expect(Array.isArray(classes)).toBe(true);
      expect(classes.length).toBe(2);
    });

    it('should filter archived classes when specified', async () => {
      // Create active and archived classes
      await classModel.create([
        {
          name: 'Active Class',
          description: 'Description 1',
          createdBy: new Types.ObjectId(mockRequest.user.sub),
          code: 'CODE1',
          settings: {},
          archived: false,
        },
        {
          name: 'Archived Class',
          description: 'Description 2',
          createdBy: new Types.ObjectId(mockRequest.user.sub),
          code: 'CODE2',
          settings: {},
          archived: true,
        },
      ]);

      // Mock memberships to return all classes for this user
      const classesCreated = await classModel.find().exec();
      mockMembershipService.findByUser.mockResolvedValue([
        { classId: classesCreated[0]._id.toString() },
        { classId: classesCreated[1]._id.toString() }
      ]);

      const activeClasses = await classService.findAll(false);
      expect(activeClasses.length).toBe(1);
      expect(activeClasses[0].name).toBe('Active Class');

      const archivedClasses = await classService.findAll(true);
      expect(archivedClasses.length).toBe(1);
      expect(archivedClasses[0].name).toBe('Archived Class');
    });
  });

  describe('findOne', () => {
    it('should return a class by id', async () => {
      const classEntity = await classModel.create({
        name: 'Test Class',
        description: 'Test Description',
        createdBy: new Types.ObjectId(mockRequest.user.sub),
        code: 'CODE1',
        settings: {},
        archived: false,
      });

      const result = await classService.findOne(classEntity._id.toString());
      
      expect(result).toBeDefined();
      expect(result.name).toBe('Test Class');
      expect(result.id.toString()).toBe(classEntity._id.toString());
    });

    it('should throw NotFoundException when class not found', async () => {
      const nonExistentId = new Types.ObjectId().toString();
      await expect(classService.findOne(nonExistentId))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('should return a class by code', async () => {
      const classEntity = await classModel.create({
        name: 'Test Class',
        description: 'Test Description',
        createdBy: new Types.ObjectId(mockRequest.user.sub),
        code: 'TEST123',
        settings: {},
        archived: false,
      });

      const result = await classService.findByCode('TEST123');
      
      expect(result).toBeDefined();
      expect(result.code).toBe('TEST123');
      expect(result.id.toString()).toBe(classEntity._id.toString());
    });

    it('should throw NotFoundException when code not found', async () => {
      await expect(classService.findByCode('NONEXISTENT'))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a class', async () => {
      const classEntity = await classModel.create({
        name: 'Original Name',
        description: 'Original Description',
        createdBy: new Types.ObjectId(mockRequest.user.sub),
        code: 'CODE1',
        settings: {},
        archived: false,
      });

      const updateDto: UpdateClassDto = {
        name: 'Updated Name',
        description: 'Updated Description',
        settings: { newKey: 'newValue' },
      };

      const result = await classService.update(classEntity._id.toString(), updateDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(updateDto.name);
      expect(result.description).toBe(updateDto.description);
      expect(result.settings).toEqual(updateDto.settings);
      expect(result.id.toString()).toBe(classEntity._id.toString());
    });

    it('should throw NotFoundException when updating non-existent class', async () => {
      const nonExistentId = new Types.ObjectId().toString();
      const updateDto: UpdateClassDto = {
        name: 'Updated Name',
      };

      await expect(classService.update(nonExistentId, updateDto))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('archive', () => {
    it('should archive a class', async () => {
      const classEntity = await classModel.create({
        name: 'Test Class',
        description: 'Test Description',
        createdBy: new Types.ObjectId(mockRequest.user.sub),
        code: 'CODE1',
        settings: {},
        archived: false,
      });

      const result = await classService.archive(classEntity._id.toString());

      expect(result).toBeDefined();
      expect(result.archived).toBe(true);
      expect(result.id.toString()).toBe(classEntity._id.toString());
    });

    it('should throw NotFoundException when archiving non-existent class', async () => {
      const nonExistentId = new Types.ObjectId().toString();
      await expect(classService.archive(nonExistentId))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('regenerateCode', () => {
    it('should regenerate class code', async () => {
      const classEntity = await classModel.create({
        name: 'Test Class',
        description: 'Test Description',
        createdBy: new Types.ObjectId(mockRequest.user.sub),
        code: 'OLD_CODE',
        settings: {},
        archived: false,
      });

      const result = await classService.regenerateCode(classEntity._id.toString());

      expect(result).toBeDefined();
      expect(result.code).not.toBe('OLD_CODE');
    });

    it('should throw NotFoundException when regenerating code for non-existent class', async () => {
      const nonExistentId = new Types.ObjectId().toString();
      await expect(classService.regenerateCode(nonExistentId))
        .rejects
        .toThrow(NotFoundException);
    });
  });
}); 