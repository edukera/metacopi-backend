import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export enum StorageFolderType {
  TASK_RESOURCES = 'task-resources',
  SUBMISSIONS = 'submissions',
  SUBMISSIONS_RAW = 'submissions/raw',
  SUBMISSIONS_PROCESSED = 'submissions/processed',
}

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    // Initialize the S3 client
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION') || 'eu-west-3',
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });

    this.bucket = this.configService.get<string>('AWS_S3_BUCKET') || 'metacopi-storage';
  }

  /**
   * Generates an S3 key based on folder type and filename
   */
  generateKey(folderType: StorageFolderType, filename: string, entityId?: string): string {
    if (entityId) {
      return `${folderType}/${entityId}/${filename}`;
    }
    return `${folderType}/${filename}`;
  }

  /**
   * Generates a presigned URL for uploading a file to S3
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Generates a presigned URL for downloading a file from S3
   */
  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Deletes a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Lists all files in a specific folder
   */
  async listFiles(prefix: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    });

    const response = await this.s3Client.send(command);
    
    return response.Contents
      ? response.Contents.map(item => item.Key).filter(Boolean) as string[]
      : [];
  }

  /**
   * Generates presigned URLs for a list of S3 keys
   */
  async getPresignedDownloadUrls(keys: string[], expiresIn = 3600): Promise<{ [key: string]: string }> {
    const urlMap: { [key: string]: string } = {};
    
    for (const key of keys) {
      if (key) {
        const url = await this.getPresignedDownloadUrl(key, expiresIn);
        console.log('url', url);
        urlMap[key] = url;
      }
    }
    
    return urlMap;
  }

  // Alias for compatibility
  generateUploadUrl = this.getPresignedUploadUrl;
  generateDownloadUrl = this.getPresignedDownloadUrl;
} 