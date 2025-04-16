import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionStatusTransitionValidator } from './submission-status-transition.validator';
import { Submission, SubmissionStatus } from '../submission.schema';

describe('SubmissionStatusTransitionValidator', () => {
  let validator: SubmissionStatusTransitionValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubmissionStatusTransitionValidator],
    }).compile();

    validator = module.get<SubmissionStatusTransitionValidator>(SubmissionStatusTransitionValidator);
  });

  it('should be defined', () => {
    expect(validator).toBeDefined();
  });

  describe('isValidTransition', () => {
    it('should allow transitions from DRAFT to SUBMITTED', () => {
      const submission = { status: SubmissionStatus.DRAFT } as Submission;
      expect(validator.isValidTransition(submission, SubmissionStatus.SUBMITTED)).toBe(true);
    });

    it('should allow transitions from DRAFT to ARCHIVED', () => {
      const submission = { status: SubmissionStatus.DRAFT } as Submission;
      expect(validator.isValidTransition(submission, SubmissionStatus.ARCHIVED)).toBe(true);
    });

    it('should allow transitions from SUBMITTED to CORRECTED', () => {
      const submission = { status: SubmissionStatus.SUBMITTED } as Submission;
      expect(validator.isValidTransition(submission, SubmissionStatus.CORRECTED)).toBe(true);
    });

    it('should allow transitions from SUBMITTED to ARCHIVED', () => {
      const submission = { status: SubmissionStatus.SUBMITTED } as Submission;
      expect(validator.isValidTransition(submission, SubmissionStatus.ARCHIVED)).toBe(true);
    });

    it('should allow transitions from CORRECTED to ARCHIVED', () => {
      const submission = { status: SubmissionStatus.CORRECTED } as Submission;
      expect(validator.isValidTransition(submission, SubmissionStatus.ARCHIVED)).toBe(true);
    });

    it('should not allow transitions from DRAFT to CORRECTED', () => {
      const submission = { status: SubmissionStatus.DRAFT } as Submission;
      expect(validator.isValidTransition(submission, SubmissionStatus.CORRECTED)).toBe(false);
    });

    it('should not allow transitions from SUBMITTED to DRAFT', () => {
      const submission = { status: SubmissionStatus.SUBMITTED } as Submission;
      expect(validator.isValidTransition(submission, SubmissionStatus.DRAFT)).toBe(false);
    });

    it('should not allow transitions from CORRECTED to DRAFT or SUBMITTED', () => {
      const submission = { status: SubmissionStatus.CORRECTED } as Submission;
      expect(validator.isValidTransition(submission, SubmissionStatus.DRAFT)).toBe(false);
      expect(validator.isValidTransition(submission, SubmissionStatus.SUBMITTED)).toBe(false);
    });

    it('should not allow any transitions from ARCHIVED', () => {
      const submission = { status: SubmissionStatus.ARCHIVED } as Submission;
      expect(validator.isValidTransition(submission, SubmissionStatus.DRAFT)).toBe(false);
      expect(validator.isValidTransition(submission, SubmissionStatus.SUBMITTED)).toBe(false);
      expect(validator.isValidTransition(submission, SubmissionStatus.CORRECTED)).toBe(false);
    });

    it('should allow keeping the same status', () => {
      const statuses = Object.values(SubmissionStatus);
      
      statuses.forEach(status => {
        const submission = { status } as Submission;
        expect(validator.isValidTransition(submission, status)).toBe(true);
      });
    });
  });

  describe('getAllowedTransitions', () => {
    it('should return correct transitions from DRAFT', () => {
      const transitions = validator.getAllowedTransitions(SubmissionStatus.DRAFT);
      expect(transitions).toEqual([SubmissionStatus.SUBMITTED, SubmissionStatus.ARCHIVED]);
    });

    it('should return correct transitions from SUBMITTED', () => {
      const transitions = validator.getAllowedTransitions(SubmissionStatus.SUBMITTED);
      expect(transitions).toEqual([SubmissionStatus.CORRECTED, SubmissionStatus.ARCHIVED]);
    });

    it('should return only ARCHIVED as transition from CORRECTED', () => {
      const transitions = validator.getAllowedTransitions(SubmissionStatus.CORRECTED);
      expect(transitions).toEqual([SubmissionStatus.ARCHIVED]);
    });

    it('should return empty array for ARCHIVED', () => {
      const transitions = validator.getAllowedTransitions(SubmissionStatus.ARCHIVED);
      expect(transitions).toEqual([]);
    });
  });
}); 