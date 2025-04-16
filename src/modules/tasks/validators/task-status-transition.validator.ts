import { Injectable } from '@nestjs/common';
import { StatusTransitionValidator } from '../../../common/validators/status-transition.validator';
import { Task, TaskStatus } from '../task.schema';

/**
 * Status transition validator for tasks
 * 
 * The transition rules are:
 * - DRAFT -> PUBLISHED, ARCHIVED
 * - PUBLISHED -> ARCHIVED
 * - ARCHIVED -> no transition possible
 */
@Injectable()
export class TaskStatusTransitionValidator implements StatusTransitionValidator<Task, TaskStatus> {
  // Definition of the transition matrix (current state -> possible states)
  private readonly transitionMatrix: Record<TaskStatus, TaskStatus[]> = {
    [TaskStatus.DRAFT]: [TaskStatus.PUBLISHED, TaskStatus.ARCHIVED],
    [TaskStatus.PUBLISHED]: [TaskStatus.ARCHIVED],
    [TaskStatus.ARCHIVED]: [],
  };

  /**
   * Checks if a status transition is valid for a task
   * 
   * @param task The task whose status will be modified
   * @param newStatus The proposed new status
   * @returns true if the transition is allowed, false otherwise
   */
  isValidTransition(task: Task, newStatus: TaskStatus): boolean {
    const currentStatus = task.status;
    
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
  getAllowedTransitions(currentStatus: TaskStatus): TaskStatus[] {
    return this.transitionMatrix[currentStatus] || [];
  }
} 