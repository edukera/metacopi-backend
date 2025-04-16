import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatusTransitionValidator } from '../../modules/tasks/validators/task-status-transition.validator';
import { SubmissionStatusTransitionValidator } from '../../modules/submissions/validators/submission-status-transition.validator';
import { CorrectionStatusTransitionValidator } from '../../modules/corrections/validators/correction-status-transition.validator';
import { Task, TaskStatus } from '../../modules/tasks/task.schema';
import { Submission, SubmissionStatus } from '../../modules/submissions/submission.schema';
import { Correction, CorrectionStatus } from '../../modules/corrections/correction.schema';

/**
 * Centralized service for status transition validation
 * This service groups validators specific to each entity
 */
@Injectable()
export class StatusTransitionService {
  constructor(
    private readonly taskValidator: TaskStatusTransitionValidator,
    private readonly submissionValidator: SubmissionStatusTransitionValidator,
    private readonly correctionValidator: CorrectionStatusTransitionValidator,
  ) {}

  /**
   * Validates a task status change
   * @param task The task to update
   * @param newStatus The proposed new status
   * @throws BadRequestException if the transition is not valid
   */
  validateTaskStatusTransition(task: Task, newStatus: TaskStatus): void {
    if (!this.taskValidator.isValidTransition(task, newStatus)) {
      const allowedTransitions = this.taskValidator.getAllowedTransitions(task.status);
      throw new BadRequestException(
        `Invalid status transition from '${task.status}' to '${newStatus}'. Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`,
      );
    }
  }

  /**
   * Validates a submission status change
   * @param submission The submission to update
   * @param newStatus The proposed new status
   * @throws BadRequestException if the transition is not valid
   */
  validateSubmissionStatusTransition(submission: Submission, newStatus: SubmissionStatus): void {
    if (!this.submissionValidator.isValidTransition(submission, newStatus)) {
      const allowedTransitions = this.submissionValidator.getAllowedTransitions(submission.status);
      throw new BadRequestException(
        `Invalid status transition from '${submission.status}' to '${newStatus}'. Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`,
      );
    }
  }

  /**
   * Validates a correction status change
   * @param correction The correction to update
   * @param newStatus The proposed new status
   * @throws BadRequestException if the transition is not valid
   */
  validateCorrectionStatusTransition(correction: Correction, newStatus: CorrectionStatus): void {
    if (!this.correctionValidator.isValidTransition(correction, newStatus)) {
      const allowedTransitions = this.correctionValidator.getAllowedTransitions(correction.status);
      throw new BadRequestException(
        `Invalid status transition from '${correction.status}' to '${newStatus}'. Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`,
      );
    }
  }
} 