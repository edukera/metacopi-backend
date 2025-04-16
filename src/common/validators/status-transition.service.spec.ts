import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StatusTransitionService } from './status-transition.service';
import { TaskStatusTransitionValidator } from '../../modules/tasks/validators/task-status-transition.validator';
import { SubmissionStatusTransitionValidator } from '../../modules/submissions/validators/submission-status-transition.validator';
import { CorrectionStatusTransitionValidator } from '../../modules/corrections/validators/correction-status-transition.validator';
import { Task, TaskStatus } from '../../modules/tasks/task.schema';
import { Submission, SubmissionStatus } from '../../modules/submissions/submission.schema';
import { Correction, CorrectionStatus } from '../../modules/corrections/correction.schema';

describe('StatusTransitionService', () => {
  let service: StatusTransitionService;
  let taskValidator: TaskStatusTransitionValidator;
  let submissionValidator: SubmissionStatusTransitionValidator;
  let correctionValidator: CorrectionStatusTransitionValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusTransitionService,
        {
          provide: TaskStatusTransitionValidator,
          useValue: {
            isValidTransition: jest.fn(),
            getAllowedTransitions: jest.fn(),
          },
        },
        {
          provide: SubmissionStatusTransitionValidator,
          useValue: {
            isValidTransition: jest.fn(),
            getAllowedTransitions: jest.fn(),
          },
        },
        {
          provide: CorrectionStatusTransitionValidator,
          useValue: {
            isValidTransition: jest.fn(),
            getAllowedTransitions: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StatusTransitionService>(StatusTransitionService);
    taskValidator = module.get<TaskStatusTransitionValidator>(TaskStatusTransitionValidator);
    submissionValidator = module.get<SubmissionStatusTransitionValidator>(SubmissionStatusTransitionValidator);
    correctionValidator = module.get<CorrectionStatusTransitionValidator>(CorrectionStatusTransitionValidator);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateTaskStatusTransition', () => {
    it('should not throw when transition is valid', () => {
      const task = { status: TaskStatus.DRAFT } as Task;
      jest.spyOn(taskValidator, 'isValidTransition').mockReturnValue(true);

      expect(() => service.validateTaskStatusTransition(task, TaskStatus.PUBLISHED)).not.toThrow();
      expect(taskValidator.isValidTransition).toHaveBeenCalledWith(task, TaskStatus.PUBLISHED);
    });

    it('should throw BadRequestException when transition is invalid', () => {
      const task = { status: TaskStatus.PUBLISHED } as Task;
      jest.spyOn(taskValidator, 'isValidTransition').mockReturnValue(false);
      jest.spyOn(taskValidator, 'getAllowedTransitions').mockReturnValue([TaskStatus.ARCHIVED]);

      expect(() => service.validateTaskStatusTransition(task, TaskStatus.DRAFT)).toThrow(BadRequestException);
      expect(taskValidator.isValidTransition).toHaveBeenCalledWith(task, TaskStatus.DRAFT);
      expect(taskValidator.getAllowedTransitions).toHaveBeenCalledWith(TaskStatus.PUBLISHED);
    });
  });

  describe('validateSubmissionStatusTransition', () => {
    it('should not throw when transition is valid', () => {
      const submission = { status: SubmissionStatus.DRAFT } as Submission;
      jest.spyOn(submissionValidator, 'isValidTransition').mockReturnValue(true);

      expect(() => service.validateSubmissionStatusTransition(submission, SubmissionStatus.SUBMITTED)).not.toThrow();
      expect(submissionValidator.isValidTransition).toHaveBeenCalledWith(submission, SubmissionStatus.SUBMITTED);
    });

    it('should throw BadRequestException when transition is invalid', () => {
      const submission = { status: SubmissionStatus.CORRECTED } as Submission;
      jest.spyOn(submissionValidator, 'isValidTransition').mockReturnValue(false);
      jest.spyOn(submissionValidator, 'getAllowedTransitions').mockReturnValue([SubmissionStatus.ARCHIVED]);

      expect(() => service.validateSubmissionStatusTransition(submission, SubmissionStatus.DRAFT)).toThrow(BadRequestException);
      expect(submissionValidator.isValidTransition).toHaveBeenCalledWith(submission, SubmissionStatus.DRAFT);
      expect(submissionValidator.getAllowedTransitions).toHaveBeenCalledWith(SubmissionStatus.CORRECTED);
    });
  });

  describe('validateCorrectionStatusTransition', () => {
    it('should not throw when transition is valid', () => {
      const correction = { status: CorrectionStatus.IN_PROGRESS } as Correction;
      jest.spyOn(correctionValidator, 'isValidTransition').mockReturnValue(true);

      expect(() => service.validateCorrectionStatusTransition(correction, CorrectionStatus.COMPLETED)).not.toThrow();
      expect(correctionValidator.isValidTransition).toHaveBeenCalledWith(correction, CorrectionStatus.COMPLETED);
    });

    it('should throw BadRequestException when transition is invalid', () => {
      const correction = { status: CorrectionStatus.COMPLETED } as Correction;
      jest.spyOn(correctionValidator, 'isValidTransition').mockReturnValue(false);
      jest.spyOn(correctionValidator, 'getAllowedTransitions').mockReturnValue([]);

      expect(() => service.validateCorrectionStatusTransition(correction, CorrectionStatus.IN_PROGRESS)).toThrow(BadRequestException);
      expect(correctionValidator.isValidTransition).toHaveBeenCalledWith(correction, CorrectionStatus.IN_PROGRESS);
      expect(correctionValidator.getAllowedTransitions).toHaveBeenCalledWith(CorrectionStatus.COMPLETED);
    });
  });
}); 