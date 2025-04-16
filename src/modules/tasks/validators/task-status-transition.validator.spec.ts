import { Test, TestingModule } from '@nestjs/testing';
import { TaskStatusTransitionValidator } from './task-status-transition.validator';
import { Task, TaskStatus } from '../task.schema';

describe('TaskStatusTransitionValidator', () => {
  let validator: TaskStatusTransitionValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskStatusTransitionValidator],
    }).compile();

    validator = module.get<TaskStatusTransitionValidator>(TaskStatusTransitionValidator);
  });

  it('should be defined', () => {
    expect(validator).toBeDefined();
  });

  describe('isValidTransition', () => {
    it('should allow transitions from DRAFT to PUBLISHED', () => {
      const task = { status: TaskStatus.DRAFT } as Task;
      expect(validator.isValidTransition(task, TaskStatus.PUBLISHED)).toBe(true);
    });

    it('should allow transitions from DRAFT to ARCHIVED', () => {
      const task = { status: TaskStatus.DRAFT } as Task;
      expect(validator.isValidTransition(task, TaskStatus.ARCHIVED)).toBe(true);
    });

    it('should allow transitions from PUBLISHED to ARCHIVED', () => {
      const task = { status: TaskStatus.PUBLISHED } as Task;
      expect(validator.isValidTransition(task, TaskStatus.ARCHIVED)).toBe(true);
    });

    it('should not allow transitions from PUBLISHED to DRAFT', () => {
      const task = { status: TaskStatus.PUBLISHED } as Task;
      expect(validator.isValidTransition(task, TaskStatus.DRAFT)).toBe(false);
    });

    it('should not allow any transitions from ARCHIVED', () => {
      const task = { status: TaskStatus.ARCHIVED } as Task;
      expect(validator.isValidTransition(task, TaskStatus.DRAFT)).toBe(false);
      expect(validator.isValidTransition(task, TaskStatus.PUBLISHED)).toBe(false);
    });

    it('should allow keeping the same status', () => {
      const draftTask = { status: TaskStatus.DRAFT } as Task;
      const publishedTask = { status: TaskStatus.PUBLISHED } as Task;
      const archivedTask = { status: TaskStatus.ARCHIVED } as Task;

      expect(validator.isValidTransition(draftTask, TaskStatus.DRAFT)).toBe(true);
      expect(validator.isValidTransition(publishedTask, TaskStatus.PUBLISHED)).toBe(true);
      expect(validator.isValidTransition(archivedTask, TaskStatus.ARCHIVED)).toBe(true);
    });
  });

  describe('getAllowedTransitions', () => {
    it('should return all possible transitions from DRAFT', () => {
      const transitions = validator.getAllowedTransitions(TaskStatus.DRAFT);
      expect(transitions).toEqual([TaskStatus.PUBLISHED, TaskStatus.ARCHIVED]);
    });

    it('should return only ARCHIVED as transition from PUBLISHED', () => {
      const transitions = validator.getAllowedTransitions(TaskStatus.PUBLISHED);
      expect(transitions).toEqual([TaskStatus.ARCHIVED]);
    });

    it('should return empty array for ARCHIVED', () => {
      const transitions = validator.getAllowedTransitions(TaskStatus.ARCHIVED);
      expect(transitions).toEqual([]);
    });
  });
}); 