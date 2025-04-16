/**
 * Interface for all status transition validators
 * ensuring that state changes follow defined business rules
 */
export interface StatusTransitionValidator<T, S> {
  /**
   * Checks if a status transition is valid for a given entity
   * 
   * @param entity The entity whose status will be modified
   * @param newStatus The proposed new status
   * @returns true if the transition is allowed, false otherwise
   */
  isValidTransition(entity: T, newStatus: S): boolean;
  
  /**
   * Returns the list of allowed transitions from a given status
   * 
   * @param currentStatus The current status
   * @returns An array of statuses to which we can transition
   */
  getAllowedTransitions(currentStatus: S): S[];
} 