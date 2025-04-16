import { Injectable } from '@nestjs/common';
import { StatusTransitionValidator } from '../../../common/validators/status-transition.validator';
import { Submission, SubmissionStatus } from '../submission.schema';

/**
 * Status transition validator for submissions
 * 
 * The transition rules are:
 * - DRAFT -> SUBMITTED
 * - SUBMITTED -> CORRECTED
 * - CORRECTED -> ARCHIVED
 * - Any entity can be ARCHIVED 
 */
@Injectable()
export class SubmissionStatusTransitionValidator implements StatusTransitionValidator<Submission, SubmissionStatus> {
  // Definition of the transition matrix (current state -> possible states)
  private readonly transitionMatrix: Record<SubmissionStatus, SubmissionStatus[]> = {
    [SubmissionStatus.DRAFT]: [SubmissionStatus.SUBMITTED, SubmissionStatus.ARCHIVED],
    [SubmissionStatus.SUBMITTED]: [SubmissionStatus.CORRECTED, SubmissionStatus.ARCHIVED],
    [SubmissionStatus.CORRECTED]: [SubmissionStatus.ARCHIVED],
    [SubmissionStatus.ARCHIVED]: [],
  };

  /**
   * Checks if a status transition is valid for a submission
   * 
   * @param submission The submission whose status will be modified
   * @param newStatus The proposed new status
   * @returns true if the transition is allowed, false otherwise
   */
  isValidTransition(submission: Submission, newStatus: SubmissionStatus): boolean {
    const currentStatus = submission.status;
    
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
   * @returns An array of statuses to which we can transition
   */
  getAllowedTransitions(currentStatus: SubmissionStatus): SubmissionStatus[] {
    return this.transitionMatrix[currentStatus] || [];
  }
} 