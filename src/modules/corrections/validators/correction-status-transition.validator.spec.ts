import { Test, TestingModule } from '@nestjs/testing';
import { CorrectionStatusTransitionValidator } from './correction-status-transition.validator';
import { Correction, CorrectionStatus } from '../correction.schema';

describe('CorrectionStatusTransitionValidator', () => {
  let validator: CorrectionStatusTransitionValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CorrectionStatusTransitionValidator],
    }).compile();

    validator = module.get<CorrectionStatusTransitionValidator>(CorrectionStatusTransitionValidator);
  });

  it('should be defined', () => {
    expect(validator).toBeDefined();
  });

  describe('isValidTransition', () => {
    it('should allow transitions from IN_PROGRESS to COMPLETED', () => {
      const correction = { status: CorrectionStatus.IN_PROGRESS } as Correction;
      expect(validator.isValidTransition(correction, CorrectionStatus.COMPLETED)).toBe(true);
    });

    it('should not allow transitions from COMPLETED to IN_PROGRESS', () => {
      const correction = { status: CorrectionStatus.COMPLETED } as Correction;
      expect(validator.isValidTransition(correction, CorrectionStatus.IN_PROGRESS)).toBe(false);
    });

    it('should allow keeping the same status', () => {
      const inProgressCorrection = { status: CorrectionStatus.IN_PROGRESS } as Correction;
      const completedCorrection = { status: CorrectionStatus.COMPLETED } as Correction;

      expect(validator.isValidTransition(inProgressCorrection, CorrectionStatus.IN_PROGRESS)).toBe(true);
      expect(validator.isValidTransition(completedCorrection, CorrectionStatus.COMPLETED)).toBe(true);
    });
  });

  describe('getAllowedTransitions', () => {
    it('should return only COMPLETED as transition from IN_PROGRESS', () => {
      const transitions = validator.getAllowedTransitions(CorrectionStatus.IN_PROGRESS);
      expect(transitions).toEqual([CorrectionStatus.COMPLETED]);
    });

    it('should return empty array for COMPLETED', () => {
      const transitions = validator.getAllowedTransitions(CorrectionStatus.COMPLETED);
      expect(transitions).toEqual([]);
    });
  });
}); 