import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnnotationController } from './annotation.controller';
import { AnnotationService } from './annotation.service';
import { Annotation, AnnotationSchema } from './annotation.schema';
import { CorrectionModule } from '../corrections/correction.module';
import { IsValidJson } from './validators/is-valid-json.validator';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Annotation.name, schema: AnnotationSchema },
    ]),
    CorrectionModule,
  ],
  controllers: [AnnotationController],
  providers: [AnnotationService, IsValidJson],
  exports: [AnnotationService],
})
export class AnnotationModule {} 