export enum Permission {
  // Users
  READ_USERS = 'read:users',
  CREATE_USERS = 'create:users',
  UPDATE_USERS = 'update:users',
  DELETE_USERS = 'delete:users',
  
  // Memberships
  READ_MEMBERSHIPS = 'read:memberships',
  CREATE_MEMBERSHIPS = 'create:memberships',
  UPDATE_MEMBERSHIPS = 'update:memberships',
  DELETE_MEMBERSHIPS = 'delete:memberships',
  
  // Classes
  READ_CLASSES = 'read:classes',
  CREATE_CLASSES = 'create:classes',
  UPDATE_CLASSES = 'update:classes',
  DELETE_CLASSES = 'delete:classes',
  
  // Tasks
  READ_TASKS = 'read:tasks',
  CREATE_TASKS = 'create:tasks',
  UPDATE_TASKS = 'update:tasks',
  DELETE_TASKS = 'delete:tasks',
  
  // Task Resources
  READ_TASK_RESOURCES = 'read:task-resources',
  CREATE_TASK_RESOURCES = 'create:task-resources',
  UPDATE_TASK_RESOURCES = 'update:task-resources',
  DELETE_TASK_RESOURCES = 'delete:task-resources',
  
  // Submissions
  READ_SUBMISSIONS = 'read:submissions',
  CREATE_SUBMISSIONS = 'create:submissions',
  UPDATE_SUBMISSIONS = 'update:submissions',
  DELETE_SUBMISSIONS = 'delete:submissions',
  
  // Corrections
  READ_CORRECTIONS = 'read:corrections',
  CREATE_CORRECTIONS = 'create:corrections',
  UPDATE_CORRECTIONS = 'update:corrections',
  DELETE_CORRECTIONS = 'delete:corrections',
  
  // Audit Logs
  READ_AUDIT_LOGS = 'read:audit-logs',
  CREATE_AUDIT_LOGS = 'create:audit-logs',
  DELETE_AUDIT_LOGS = 'delete:audit-logs',
} 