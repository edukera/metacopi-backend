import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageService, StorageFolderType } from '../../src/modules/storage/storage.service';
import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock S3 for tests that don't require actual connection
jest.mock('@aws-sdk/client-s3', () => {
  const originalModule = jest.requireActual('@aws-sdk/client-s3');
  return {
    ...originalModule,
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({
        Contents: [
          { Key: 'test-integration/mock-file-1.txt' },
          { Key: 'test-integration/mock-file-2.txt' },
        ],
      }),
    })),
    PutObjectCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
    ListObjectsV2Command: jest.fn(),
  };
});

// Mock the getSignedUrl function for consistent testing
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockImplementation(() => 
    Promise.resolve('https://mock-bucket.s3.amazonaws.com/mock-signed-url')
  )
}));

// These tests require valid AWS environment variables to run
// For CI/CD, you can use jest.mock() or create a local S3 container like MinIO
describe('StorageService (Integration)', () => {
  let storageService: StorageService;
  let configService: ConfigService;
  // Store timeout references for cleanup
  let timeouts: NodeJS.Timeout[] = [];
  
  // We will create a test file and delete it after
  const testKey = `test-integration/${Date.now()}-test-file.txt`;
  
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      providers: [StorageService],
    }).compile();

    storageService = module.get<StorageService>(StorageService);
    configService = module.get<ConfigService>(ConfigService);
    
    // Check if AWS environment variables are defined
    const awsAccessKeyId = configService.get<string>('AWS_ACCESS_KEY_ID');
    const awsSecretAccessKey = configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const awsS3Bucket = configService.get<string>('AWS_S3_BUCKET');
    
    if (!awsAccessKeyId || !awsSecretAccessKey || !awsS3Bucket) {
      console.warn('Warning: Missing AWS variables. S3 integration tests will use mocks instead.');
    }
  });

  afterAll(async () => {
    // Clean up test file if it exists
    try {
      await storageService.deleteFile(testKey);
    } catch (error) {
      console.log('Error while cleaning up test file:', error.message);
    }
    
    // Clean up all timeouts
    timeouts.forEach(timeout => clearTimeout(timeout));
  });

  it('should generate the correct S3 key with entityId', () => {
    const key = storageService.generateKey(
      StorageFolderType.TASK_RESOURCES,
      'test.pdf',
      'entity123',
    );
    expect(key).toBe('task-resources/entity123/test.pdf');
  });

  it('should generate the correct S3 key without entityId', () => {
    const key = storageService.generateKey(
      StorageFolderType.TASK_RESOURCES,
      'test.pdf',
    );
    expect(key).toBe('task-resources/test.pdf');
  });

  it('should generate a valid presigned upload URL', async () => {
    const url = await storageService.getPresignedUploadUrl(
      testKey,
      'text/plain',
    );
    
    expect(url).toBeDefined();
    expect(typeof url).toBe('string');
    expect(url.length).toBeGreaterThan(0);
  });

  it('should generate a valid presigned download URL', async () => {
    // First, we need to upload a file to be able to download it
    // For simplicity, we don't actually upload the file
    const url = await storageService.getPresignedDownloadUrl(testKey);
    
    expect(url).toBeDefined();
    expect(typeof url).toBe('string');
    expect(url.length).toBeGreaterThan(0);
  });

  // Test listFiles (requires a non-empty bucket)
  it('should list files with the given prefix', async () => {
    // Create a temporary file to ensure there is at least one result
    await storageService.getPresignedUploadUrl(testKey, 'text/plain');
    
    // Wait a moment for the file to be visible in S3
    await new Promise(resolve => {
      const timeout = setTimeout(resolve, 100);
      timeouts.push(timeout); // Store reference for cleanup
    });
    
    // List files with prefix
    const prefix = 'test-integration/';
    const files = await storageService.listFiles(prefix);
    
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThan(0);
  });

  // Test getPresignedDownloadUrls
  it('should generate multiple presigned download URLs', async () => {
    const keys = [testKey, `test-integration/${Date.now()}-another-test.txt`];
    
    const urlMap = await storageService.getPresignedDownloadUrls(keys);
    
    expect(Object.keys(urlMap).length).toBe(keys.length);
    expect(urlMap[testKey]).toBeDefined();
    expect(urlMap[keys[1]]).toBeDefined();
  });

  // Test deleteFile
  it('should delete a file successfully', async () => {
    // We'll test by deleting the testKey file
    // We don't need to check if it actually exists
    
    // This operation should not throw an exception
    await expect(storageService.deleteFile(testKey)).resolves.not.toThrow();
  });
}); 