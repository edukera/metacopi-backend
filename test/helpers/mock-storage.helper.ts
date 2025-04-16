import { ConfigService } from '@nestjs/config';
import { StorageService, StorageFolderType } from '../../src/modules/storage/storage.service';
import { S3Client } from '@aws-sdk/client-s3';
import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MockStorageHelper extends StorageService {
  constructor(configService: ConfigService) {
    super(configService);
  }

  /**
   * Generates a unique key for a file
   */
  generateKey(folderType: StorageFolderType, filename: string, entityId?: string): string {
    return `${folderType}/${entityId || 'test-id'}/${filename}`;
  }

  /**
   * Simulates file upload and returns a presigned URL
   */
  async getPresignedUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    return `https://test-bucket.s3.amazonaws.com/${key}?type=upload`;
  }

  /**
   * Simulates generating a download URL for a file
   */
  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    return `https://test-bucket.s3.amazonaws.com/${key}?type=download`;
  }

  /**
   * Simulates file deletion
   */
  async deleteFile(key: string): Promise<void> {
    // Mock implementation
  }

  /**
   * Simulates listing files in a folder
   */
  async listFiles(prefix: string): Promise<string[]> {
    return ['test-file.pdf'];
  }

  /**
   * Utility methods for tests
   */
  async mockFileUpload(folderType: StorageFolderType, filename: string, entityId?: string): Promise<string> {
    const key = this.generateKey(folderType, filename, entityId);
    return key;
  }

  async mockMultipleFileUploads(folderType: StorageFolderType, count: number, entityId?: string): Promise<string[]> {
    const promises = Array(count)
      .fill(null)
      .map(() => this.mockFileUpload(folderType, faker.system.fileName(), entityId));
    return Promise.all(promises);
  }

  async mockFileDownload(key: string): Promise<string> {
    return `https://mock-download-url.com/${key}`;
  }

  async getPresignedDownloadUrls(keys: string[], expiresIn = 3600): Promise<{ [key: string]: string }> {
    const urlMap: { [key: string]: string } = {};
    for (const key of keys) {
      urlMap[key] = await this.getPresignedDownloadUrl(key);
    }
    return urlMap;
  }

  // Aliases for compatibility
  generateUploadUrl = this.getPresignedUploadUrl;
  generateDownloadUrl = this.getPresignedDownloadUrl;
} 