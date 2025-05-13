import { Module } from '@nestjs/common';
import { SeedModule } from '../database/seeds/seed.module';
import { DbResetService } from './db-reset.service';
import { DbController } from './db.controller';

@Module({
  imports: [SeedModule],
  controllers: [DbController],
  providers: [DbResetService],
  exports: [DbResetService],
})
export class DbModule {} 