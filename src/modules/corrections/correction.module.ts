import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CorrectionController } from './correction.controller';
import { CorrectionService } from './correction.service';
import { Correction, CorrectionSchema } from './correction.schema';
import { CorrectionStatusTransitionValidator } from './validators/correction-status-transition.validator';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Correction.name, schema: CorrectionSchema },
    ]),
  ],
  controllers: [CorrectionController],
  providers: [CorrectionService, CorrectionStatusTransitionValidator],
  exports: [CorrectionService, CorrectionStatusTransitionValidator],
})
export class CorrectionModule {} 