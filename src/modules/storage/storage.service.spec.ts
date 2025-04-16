import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService, StorageFolderType } from './storage.service';
import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock external dependencies
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('StorageService', () => {
  let service: StorageService;
  let configService: ConfigService;
  
  // Mocked configuration variables
  const mockConfig = {
    'AWS_REGION': 'eu-west-3',
    'AWS_ACCESS_KEY_ID': 'test-access-key',
    'AWS_SECRET_ACCESS_KEY': 'test-secret-key',
    'AWS_S3_BUCKET': 'test-bucket',
  };
  
  // Mock S3 client
  const mockS3Client = {
    send: jest.fn()
  };

  beforeEach(async () => {
    // Reset mocks between tests
    jest.clearAllMocks();
    
    // Mock getSignedUrl to return a test URL
    (getSignedUrl as jest.Mock).mockResolvedValue('https://presigned-url.example.com');
    
    // Mock S3Client constructor
    (S3Client as jest.Mock).mockImplementation(() => mockS3Client);
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => mockConfig[key]),
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize S3Client with correct config', () => {
      expect(S3Client).toHaveBeenCalledWith({
        region: 'eu-west-3',
        credentials: {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
        },
      });
      
      expect(configService.get).toHaveBeenCalledWith('AWS_REGION');
      expect(configService.get).toHaveBeenCalledWith('AWS_ACCESS_KEY_ID');
      expect(configService.get).toHaveBeenCalledWith('AWS_SECRET_ACCESS_KEY');
      expect(configService.get).toHaveBeenCalledWith('AWS_S3_BUCKET');
    });
  });

  describe('generateKey', () => {
    it('should generate correct key without entityId', () => {
      const key = service.generateKey(StorageFolderType.TASK_RESOURCES, 'test-file.pdf');
      expect(key).toBe('task-resources/test-file.pdf');
    });

    it('should generate correct key with entityId', () => {
      const key = service.generateKey(StorageFolderType.SUBMISSIONS_RAW, 'answer.jpg', 'user123');
      expect(key).toBe('submissions/raw/user123/answer.jpg');
    });
  });

  describe('getPresignedUploadUrl', () => {
    it('should call getSignedUrl with correct parameters', async () => {
      const key = 'task-resources/test-file.pdf';
      const contentType = 'application/pdf';
      
      await service.getPresignedUploadUrl(key, contentType);
      
      // Verify that getSignedUrl was called
      expect(getSignedUrl).toHaveBeenCalled();
      
      // Verify that the first argument is the S3 client
      expect((getSignedUrl as jest.Mock).mock.calls[0][0]).toBe(mockS3Client);
      
      // Verify that the third argument is the options
      expect((getSignedUrl as jest.Mock).mock.calls[0][2]).toEqual({ expiresIn: 3600 });
      
      // For the second argument, which is the PutObjectCommand,
      // we can only verify that it is an object
      const commandParam = (getSignedUrl as jest.Mock).mock.calls[0][1];
      expect(commandParam).toBeDefined();
    });
    
    it('should return presigned URL', async () => {
      const result = await service.getPresignedUploadUrl('test-key', 'test/type');
      expect(result).toBe('https://presigned-url.example.com');
    });
  });

  describe('getPresignedDownloadUrl', () => {
    it('should call getSignedUrl with correct parameters', async () => {
      const key = 'task-resources/test-file.pdf';
      
      await service.getPresignedDownloadUrl(key);
      
      // Verify that getSignedUrl was called
      expect(getSignedUrl).toHaveBeenCalled();
      
      // Verify that the first argument is the S3 client
      expect((getSignedUrl as jest.Mock).mock.calls[0][0]).toBe(mockS3Client);
      
      // Verify that the third argument is the options
      expect((getSignedUrl as jest.Mock).mock.calls[0][2]).toEqual({ expiresIn: 3600 });
      
      // For the second argument, which is the GetObjectCommand,
      // we can only verify that it is an object
      const commandParam = (getSignedUrl as jest.Mock).mock.calls[0][1];
      expect(commandParam).toBeDefined();
    });
  });

  describe('deleteFile', () => {
    it('should call S3Client.send with DeleteObjectCommand', async () => {
      const key = 'task-resources/test-file.pdf';
      
      await service.deleteFile(key);
      
      // Verify that mockS3Client.send was called
      expect(mockS3Client.send).toHaveBeenCalled();
      
      // For the argument, which is the DeleteObjectCommand,
      // we can only verify that it is an object
      const commandParam = mockS3Client.send.mock.calls[0][0];
      expect(commandParam).toBeDefined();
    });
  });

  describe('listFiles', () => {
    it('should return array of keys when Contents exist', async () => {
      // Mock S3 response for ListObjectsV2Command
      mockS3Client.send.mockResolvedValueOnce({
        Contents: [
          { Key: 'task-resources/file1.pdf' },
          { Key: 'task-resources/file2.pdf' },
        ],
      });
      
      const result = await service.listFiles('task-resources/');
      
      // Verify that mockS3Client.send was called
      expect(mockS3Client.send).toHaveBeenCalled();
      
      // For the argument, which is the ListObjectsV2Command,
      // we can only verify that it is an object
      const commandParam = mockS3Client.send.mock.calls[0][0];
      expect(commandParam).toBeDefined();
      
      expect(result).toEqual(['task-resources/file1.pdf', 'task-resources/file2.pdf']);
    });
    
    it('should return empty array when Contents is empty', async () => {
      mockS3Client.send.mockResolvedValueOnce({
        Contents: [],
      });
      
      const result = await service.listFiles('task-resources/');
      expect(result).toEqual([]);
    });
    
    it('should return empty array when Contents is undefined', async () => {
      mockS3Client.send.mockResolvedValueOnce({});
      
      const result = await service.listFiles('task-resources/');
      expect(result).toEqual([]);
    });
  });

  describe('getPresignedDownloadUrls', () => {
    it('should return map of keys to presigned URLs', async () => {
      const keys = ['key1', 'key2', ''];
      
      const result = await service.getPresignedDownloadUrls(keys);
      
      expect(getSignedUrl).toHaveBeenCalledTimes(2); // Once for each valid key
      expect(result).toEqual({
        key1: 'https://presigned-url.example.com',
        key2: 'https://presigned-url.example.com',
      });
    });
  });
}); 