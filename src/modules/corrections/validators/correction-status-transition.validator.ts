import { Injectable } from '@nestjs/common';
import { StatusTransitionValidator } from '../../../common/validators/status-transition.validator';
import { Correction, CorrectionStatus } from '../correction.schema';

/**
 * Validator for correction status transitions
 * 
 * Transition rules are:
 * - IN_PROGRESS -> COMPLETED
 * - COMPLETED -> no possible transition (final status)
 */
@Injectable()
export class CorrectionStatusTransitionValidator implements StatusTransitionValidator<Correction, CorrectionStatus> {
  // Definition of the transition matrix (current state -> possible states)
  private readonly transitionMatrix: Record<CorrectionStatus, CorrectionStatus[]> = {
    [CorrectionStatus.IN_PROGRESS]: [CorrectionStatus.COMPLETED],
    [CorrectionStatus.COMPLETED]: [],
  };

  /**
   * Checks if a status transition is valid for a correction
   * 
   * @param correction The correction whose status will be modified
   * @param newStatus The proposed new status
   * @returns true if the transition is allowed, false otherwise
   */
  isValidTransition(correction: Correction, newStatus: CorrectionStatus): boolean {
    const currentStatus = correction.status;
    
    // If the status doesn't change, it's valid
    if (currentStatus === newStatus) {
      return true;
    }
    
    // Check if the transition is allowed according to the matrix
    return this.transitionMatrix[currentStatus].includes(newStatus);
  }

  /**
   * Returns the list of allowed transitions from a given status
   * 
   * @param currentStatus The current status
   * @returns An array of statuses to which we can evolve
   */
  getAllowedTransitions(currentStatus: CorrectionStatus): CorrectionStatus[] {
    return this.transitionMatrix[currentStatus] || [];
  }
} 