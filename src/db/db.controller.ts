import { Controller, Post, InternalServerErrorException, HttpStatus } from '@nestjs/common';
import { DbResetService } from './db-reset.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../common/guards/jwt-auth.guard';

@ApiTags('Database Operations')
@Controller('db')
export class DbController {
  constructor(private readonly dbResetService: DbResetService) {}

  @Post('/reset')
  @Public()
  @ApiOperation({ summary: 'Reset database to initial state with seed data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Database reset successful', schema: { properties: { status: { type: 'string', example: 'ok' } } } })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Database reset failed' })
  async resetDatabase() {
    try {
      await this.dbResetService.resetDatabase();
      return { status: 'ok' };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to reset database: ${error.message}`);
    }
  }
} 