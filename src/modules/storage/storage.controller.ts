import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { StorageService, StorageFolderType } from './storage.service';
import { JwtAuthGuard } from '../../common/guards';
import { ApiTags, ApiProperty } from '@nestjs/swagger';

class GetUploadUrlDto {
  @ApiProperty({ description: 'Filename of the file to upload', example: 'document.pdf' })
  filename: string;

  @ApiProperty({
    description: 'Type of folder to store the file in',
    enum: StorageFolderType,
    example: StorageFolderType.SUBMISSIONS
  })
  folderType: StorageFolderType;

  @ApiProperty({ description: 'Content type of the file', example: 'application/pdf' })
  contentType: string;

  @ApiProperty({
    description: 'Optional ID of the entity this file is related to',
    required: false,
    example: '60d21b4667d0d8992e610c85'
  })
  entityId?: string;
}

@ApiTags('storage')
@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-upload-url')
  async getPresignedUploadUrl(@Body() dto: GetUploadUrlDto) {
    if (!dto.filename || !dto.contentType || !Object.values(StorageFolderType).includes(dto.folderType)) {
      throw new BadRequestException('Invalid inputs');
    }

    const key = this.storageService.generateKey(dto.folderType, dto.filename, dto.entityId);
    const url = await this.storageService.getPresignedUploadUrl(key, dto.contentType);

    return {
      url,
      key,
    };
  }

  @Get('presigned-download-url/:key')
  async getPresignedDownloadUrl(@Param('key') key: string) {
    if (!key) {
      throw new BadRequestException('S3 key required');
    }

    const url = await this.storageService.getPresignedDownloadUrl(key);
    return { url };
  }

  @Delete(':key')
  async deleteFile(@Param('key') key: string) {
    if (!key) {
      throw new BadRequestException('S3 key required');
    }

    await this.storageService.deleteFile(key);
    return { success: true };
  }

  @Get('list')
  async listFiles(@Query('prefix') prefix: string) {
    if (!prefix) {
      throw new BadRequestException('Prefix required');
    }

    const files = await this.storageService.listFiles(prefix);
    return { files };
  }
} 