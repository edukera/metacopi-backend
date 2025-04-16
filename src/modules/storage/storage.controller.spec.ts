import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageService, StorageFolderType } from './storage.service';

describe('StorageController', () => {
  let controller: StorageController;
  let storageService: StorageService;

  // StorageService mock
  const mockStorageService = {
    generateKey: jest.fn(),
    getPresignedUploadUrl: jest.fn(),
    getPresignedDownloadUrl: jest.fn(),
    deleteFile: jest.fn(),
    listFiles: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    controller = module.get<StorageController>(StorageController);
    storageService = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPresignedUploadUrl', () => {
    it('should return url and key for valid input', async () => {
      // Configure mocks
      const dto = {
        filename: 'test.pdf',
        folderType: StorageFolderType.TASK_RESOURCES,
        contentType: 'application/pdf',
        entityId: 'task123',
      };
      
      mockStorageService.generateKey.mockReturnValue('task-resources/task123/test.pdf');
      mockStorageService.getPresignedUploadUrl.mockResolvedValue('https://presigned-upload-url.com');

      // Call the method
      const result = await controller.getPresignedUploadUrl(dto);

      // Verify the results
      expect(mockStorageService.generateKey).toHaveBeenCalledWith(
        StorageFolderType.TASK_RESOURCES,
        'test.pdf',
        'task123',
      );
      
      expect(mockStorageService.getPresignedUploadUrl).toHaveBeenCalledWith(
        'task-resources/task123/test.pdf',
        'application/pdf',
      );

      expect(result).toEqual({
        url: 'https://presigned-upload-url.com',
        key: 'task-resources/task123/test.pdf',
      });
    });

    it('should throw BadRequestException for invalid input', async () => {
      // Test with incomplete data
      const dto = {
        filename: 'test.pdf',
        folderType: 'invalid-folder' as StorageFolderType, // Invalid type
        contentType: 'application/pdf',
      };

      // Verify that the exception is thrown
      await expect(controller.getPresignedUploadUrl(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPresignedDownloadUrl', () => {
    it('should return url for valid key', async () => {
      mockStorageService.getPresignedDownloadUrl.mockResolvedValue('https://presigned-download-url.com');

      const result = await controller.getPresignedDownloadUrl('task-resources/file.pdf');

      expect(mockStorageService.getPresignedDownloadUrl).toHaveBeenCalledWith('task-resources/file.pdf');
      expect(result).toEqual({ url: 'https://presigned-download-url.com' });
    });

    it('should throw BadRequestException for empty key', async () => {
      await expect(controller.getPresignedDownloadUrl('')).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteFile', () => {
    it('should delete file and return success', async () => {
      mockStorageService.deleteFile.mockResolvedValue(undefined);

      const result = await controller.deleteFile('task-resources/file.pdf');

      expect(mockStorageService.deleteFile).toHaveBeenCalledWith('task-resources/file.pdf');
      expect(result).toEqual({ success: true });
    });

    it('should throw BadRequestException for empty key', async () => {
      await expect(controller.deleteFile('')).rejects.toThrow(BadRequestException);
    });
  });

  describe('listFiles', () => {
    it('should return files for valid prefix', async () => {
      mockStorageService.listFiles.mockResolvedValue([
        'task-resources/file1.pdf',
        'task-resources/file2.pdf',
      ]);

      const result = await controller.listFiles('task-resources');

      expect(mockStorageService.listFiles).toHaveBeenCalledWith('task-resources');
      expect(result).toEqual({
        files: [
          'task-resources/file1.pdf',
          'task-resources/file2.pdf',
        ],
      });
    });

    it('should throw BadRequestException for empty prefix', async () => {
      await expect(controller.listFiles('')).rejects.toThrow(BadRequestException);
    });
  });
}); 