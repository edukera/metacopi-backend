# Metacopi Frontend Integration Guide

## Introduction

This document provides comprehensive guidance for frontend developers integrating with the Metacopi backend API. The Metacopi platform is a digital solution for classroom management, task assignment, submission handling, and correction workflows. This guide covers authentication flows, API endpoints, data models, and integration patterns to help frontend teams efficiently build features that interact with the backend services.

## API Overview

Metacopi backend is built with NestJS and MongoDB, providing RESTful API endpoints for all application features. The API follows consistent patterns and uses JWT for authentication.

Base URL: `http://localhost:3000` (development) or your production deployment URL.
API Documentation: `/api-docs` - Swagger UI for interactive API exploration

## Authentication

### Authentication Flow

1. **Login**: POST to `/auth/login` with credentials
2. **Token Storage**: Store JWT token securely (e.g., in HttpOnly cookies or securely in localStorage)
3. **Token Usage**: Include token in Authorization header for all authenticated requests
4. **Token Refresh**: POST to `/auth/refresh` to obtain a new token when the current one is close to expiration
5. **Profile**: GET from `/auth/profile` to obtain current user information

### Refresh Token Format Flexibility

The refresh token endpoint supports two property naming formats for maximum compatibility:

1. **Snake Case** (`refresh_token`): Follows the OAuth2 standard
2. **Camel Case** (`refreshToken`): Follows JavaScript/TypeScript conventions

Either format is accepted by the API to ensure compatibility with various client implementations and standards. If both formats are provided in the same request, the camelCase version (`refreshToken`) takes precedence.

**Example with snake_case:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Example with camelCase:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note:** Responses from the API will consistently use snake_case format (`refresh_token`) in the JSON response body.

### Authentication Endpoints

```
POST /auth/login - Authenticate user and receive token
POST /auth/refresh - Refresh authentication token
GET /auth/profile - Get current user profile
```

### Example Authentication Request

```javascript
// Login
const loginResponse = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { access_token, refresh_token } = await loginResponse.json();

// Making authenticated requests
const userDataResponse = await fetch('http://localhost:3000/users/profile', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
```

## Core Modules and Endpoints

### User Management

The Users module handles user accounts, profiles, and administrative functions.

**Endpoints:**
```
GET /users - List all users (admin only)
GET /users/:id - Get specific user
POST /users - Create new user
PATCH /users/:id - Update user
DELETE /users/:id - Delete user
```

**Key User Properties:**
- `id` - Unique identifier
- `email` - User's email (unique)
- `firstName` - User's first name
- `lastName` - User's last name
- `role` - User's role (admin, teacher, student)

### Class Management

The Classes module manages educational classes, their members, and join codes.

**Endpoints:**
```
GET /classes - List all accessible classes
GET /classes/:id - Get specific class details
POST /classes - Create new class
PATCH /classes/:id - Update class
DELETE /classes/:id - Delete class
PATCH /classes/:id/archive - Archive/unarchive class
POST /classes/:id/regenerate-code - Generate new join code
GET /classes/code/:code - Verify class code
POST /classes/:id/join - Join class with code
```

**Memberships Endpoints:**
```
GET /memberships - List all memberships
GET /memberships/:id - Get specific membership
POST /memberships - Create membership (add user to class)
PATCH /memberships/:id - Update membership (change role)
DELETE /memberships/:id - Remove membership
GET /memberships/user/:userId - Get all user's class memberships
GET /memberships/class/:classId - Get all memberships for a class
GET /memberships/user/:userId/class/:classId - Check specific membership
DELETE /memberships/class/:classId - Remove all memberships for a class
```

### Task Management

The Tasks module handles assignments created by teachers for students.

**Endpoints:**
```
GET /tasks - List all accessible tasks
GET /tasks/my-tasks - List tasks for current user
GET /tasks/:id - Get specific task
POST /tasks - Create new task
PATCH /tasks/:id - Update task
DELETE /tasks/:id - Delete task
PATCH /tasks/:id/archive - Archive/unarchive task
PATCH /tasks/:id/publish - Publish task (make available to students)
```

**Task Resources Endpoints:**
```
GET /task-resources - List all task resources
GET /task-resources/task/:taskId - Get resources for specific task
GET /task-resources/:id - Get specific resource
POST /task-resources - Create new task resource
PATCH /task-resources/:id - Update resource
DELETE /task-resources/:id - Delete resource
POST /task-resources/reorder/:taskId - Reorder task resources
```

### Submission System

The Submissions module manages work submitted by students in response to tasks.

**Endpoints:**
```
POST /submissions - Create new submission
GET /submissions - List all submissions (admin only)
GET /submissions/:id - Get specific submission
GET /submissions/task/:taskId - Get submissions for specific task
GET /submissions/student/:studentId - Get submissions by student
GET /submissions/student/:studentId/task/:taskId - Get student's submission for task
PATCH /submissions/:id - Update submission
DELETE /submissions/:id - Delete submission
```

**Submission States:**
- `draft` - Initial state, student working on submission
- `submitted` - Student has completed and submitted work
- `corrected` - Teacher has reviewed and corrected
- `archived` - Submission has been archived

### Correction System

The Corrections module handles review and grading of student submissions.

**Endpoints:**
```
POST /corrections - Create new correction
GET /corrections - List all corrections
GET /corrections/:id - Get specific correction
GET /corrections/submission/:submissionId - Get corrections for submission
GET /corrections/teacher/:teacherId - Get corrections by teacher
PATCH /corrections/:id - Update correction
DELETE /corrections/:id - Delete correction
```

### Storage System

The Storage module handles file uploads and downloads using AWS S3.

**Endpoints:**
```
POST /storage/presigned-upload-url - Get URL for direct S3 upload
GET /storage/presigned-download-url/:key - Get URL to download file
DELETE /storage/:key - Delete file from storage
GET /storage/list - List files in storage
```

### Comment System

The Comments module manages feedback and discussions attached to submissions.

**Endpoints:**
```
GET /comments - List all accessible comments
GET /comments/:id - Get specific comment
GET /comments/submission/:submissionId - Get comments for a submission
POST /comments - Create new comment
PATCH /comments/:id - Update comment
DELETE /comments/:id - Delete comment
```

### Annotation System

The Annotations module allows attaching metadata to specific parts of submissions.

**Endpoints:**
```
GET /annotations - List all accessible annotations
GET /annotations/:id - Get specific annotation
GET /annotations/submission/:submissionId - Get annotations for a submission
POST /annotations - Create new annotation with JSON metadata
PATCH /annotations/:id - Update annotation
DELETE /annotations/:id - Delete annotation
```

### Audit Logging

The Logs module tracks system activities for security and auditing.

**Endpoints:**
```
POST /logs - Create audit log entry
GET /logs - List all logs
GET /logs/:id - Get specific log
GET /logs/user/:userId - Get logs for user
GET /logs/target/:targetType/:targetId - Get logs for specific resource
GET /logs/action/:action - Get logs for specific action
DELETE /logs/:id - Delete log entry
```

## Data Models

### Submission Model

The submission system handles student work submissions with the following structure:

```typescript
{
  studentId: string;       // MongoDB ObjectId of student
  taskId: string;          // MongoDB ObjectId of associated task
  uploadedBy: string;      // User who uploaded (may differ from student)
  status: "draft" | "submitted" | "corrected" | "archived";
  rawPages: string[];      // URLs to raw/original submission files
  processedPages: string[]; // URLs to processed submission files
  submittedAt?: Date;      // When submission was officially submitted
  reviewedAt?: Date;       // When submission was reviewed by teacher
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

**Creating a Submission:**
```typescript
// Required for creating a submission
interface CreateSubmissionDto {
  taskId: string;          // Required: Task ID
  studentId?: string;      // Optional: System can use current user
  rawPages: string[];      // Required: Array of file URLs
  processedPages?: string[]; // Optional: Processed files
  status?: SubmissionStatus; // Optional: Defaults to "draft"
}
```

**Updating a Submission:**
```typescript
// All fields optional when updating
interface UpdateSubmissionDto {
  rawPages?: string[];
  processedPages?: string[];
  status?: SubmissionStatus;
  submittedAt?: Date;
  reviewedAt?: Date;
}
```

### Other Key Models

Refer to the API documentation for complete models, but key entities include:

**User:**
```
id, email, firstName, lastName, role, passwordHash, createdAt, updatedAt
```

**Class:**
```
id, name, description, createdBy, archived, code, settings, startDate, endDate
```

**Task:**
```
id, title, description, classId, dueDate, createdBy, status, files, settings
```

**Correction:**
```
id, submissionId, teacherId, comments, grade, status, createdAt, updatedAt
```

**Comment:**
```
id, submissionId, userId, content, parentId, createdAt, updatedAt
```

**Annotation:**
```
id, submissionId, userId, pageNumber, position, metadata, createdAt, updatedAt
```

## Authentication & Authorization

### JWT Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Permission System

The API implements a role-based access control system with the following roles:
- **Admin**: Full system access
- **Teacher**: Manage classes, tasks, and corrections
- **Student**: View assigned tasks, submit work

Decorators used in the backend that affect authorization:
- `@AdminOnly`: Restricts access to administrators
- `@AuthenticatedUser`: Requires authenticated user
- `@RequirePermission(Permission)`: Requires specific permission

## File Upload Flow

The recommended flow for handling file uploads:

1. **Get Presigned URL**:
   ```javascript
   const response = await fetch('/storage/presigned-upload-url', {
     method: 'POST',
     headers: { 
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       fileName: 'assignment.pdf',
       contentType: 'application/pdf'
     })
   });
   const { url, key } = await response.json();
   ```

2. **Upload directly to S3**:
   ```javascript
   await fetch(url, {
     method: 'PUT',
     headers: { 'Content-Type': 'application/pdf' },
     body: fileContent
   });
   ```

3. **Store reference in submission**:
   ```javascript
   await fetch('/submissions', {
     method: 'POST',
     headers: { 
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       taskId: 'task-id-here',
       rawPages: [`https://s3.amazonaws.com/bucket-name/${key}`]
     })
   });
   ```

## Error Handling

The API returns standardized error responses with the following structure:

```json
{
  "statusCode": 400,
  "message": "Error message here",
  "error": "Bad Request"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (e.g., duplicate entry)
- `500` - Internal Server Error

Validation errors include details about which fields failed validation:

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than 8 characters"
  ],
  "error": "Bad Request"
}
```

## Integration Patterns

### State Management

For frontend frameworks, we recommend the following state management patterns:

1. **Authentication State**: Store JWT token and user info, with automatic token refresh
2. **Data Fetching**: Implement caching and optimistic updates for responsive UX
3. **Form Handling**: Use form libraries that support the validation patterns of our DTOs
4. **Real-time Updates**: Poll relevant endpoints or implement WebSocket connection as needed

### Recommended Libraries

- **Authentication**: Auth libraries with JWT support (Auth0, NextAuth.js, etc.)
- **Data Fetching**: React Query, SWR, Apollo Client, or similar
- **Form Validation**: Formik, React Hook Form, or similar with Yup/Zod schemas
- **API Client**: Axios or fetch with interceptors for token handling

## Complete Examples

### Class Creation and Management

```javascript
// Create a new class
async function createClass(token, classData) {
  const response = await fetch('http://localhost:3000/classes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: classData.name,
      description: classData.description,
      startDate: classData.startDate,
      endDate: classData.endDate,
      settings: classData.settings || {}
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create class');
  }
  
  return response.json();
}

// Get all classes for current teacher
async function getMyClasses(token) {
  const response = await fetch('http://localhost:3000/classes', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch classes');
  }
  
  return response.json();
}

// Archive a class
async function archiveClass(token, classId) {
  const response = await fetch(`http://localhost:3000/classes/${classId}/archive`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ archived: true })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to archive class');
  }
  
  return response.json();
}
```

### Task and Submission Workflow

```javascript
// Create a task for a class
async function createTask(token, taskData) {
  const response = await fetch('http://localhost:3000/tasks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: taskData.title,
      description: taskData.description,
      classId: taskData.classId,
      dueDate: taskData.dueDate,
      // Other task properties...
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create task');
  }
  
  return response.json();
}

// Student submitting work
async function submitWork(token, submissionData) {
  // 1. Get presigned URLs for each file
  const fileUrls = await Promise.all(
    submissionData.files.map(async file => {
      const urlResponse = await fetch('http://localhost:3000/storage/presigned-upload-url', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type
        })
      });
      
      const { url, key } = await urlResponse.json();
      
      // 2. Upload file to S3
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });
      
      return `https://s3.amazonaws.com/bucket-name/${key}`;
    })
  );
  
  // 3. Create submission with file references
  const submissionResponse = await fetch('http://localhost:3000/submissions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      taskId: submissionData.taskId,
      rawPages: fileUrls,
      status: 'submitted',
      submittedAt: new Date().toISOString()
    })
  });
  
  if (!submissionResponse.ok) {
    const error = await submissionResponse.json();
    throw new Error(error.message || 'Failed to submit work');
  }
  
  return submissionResponse.json();
}

// Teacher correcting a submission
async function correctSubmission(token, correctionData) {
  const correctionResponse = await fetch('http://localhost:3000/corrections', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      submissionId: correctionData.submissionId,
      comments: correctionData.comments,
      grade: correctionData.grade,
      // Other correction properties...
    })
  });
  
  if (!correctionResponse.ok) {
    const error = await correctionResponse.json();
    throw new Error(error.message || 'Failed to create correction');
  }
  
  // Update submission status to 'corrected'
  const submissionResponse = await fetch(`http://localhost:3000/submissions/${correctionData.submissionId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'corrected',
      reviewedAt: new Date().toISOString()
    })
  });
  
  if (!submissionResponse.ok) {
    const error = await submissionResponse.json();
    throw new Error(error.message || 'Failed to update submission status');
  }
  
  return {
    correction: await correctionResponse.json(),
    submission: await submissionResponse.json()
  };
}

### Comments and Annotations Workflow

```javascript
// Create a comment on a submission
async function addComment(token, commentData) {
  const response = await fetch('http://localhost:3000/comments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      submissionId: commentData.submissionId,
      content: commentData.content,
      parentId: commentData.parentId // Optional, for reply to existing comment
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add comment');
  }
  
  return response.json();
}

// Get all comments for a submission
async function getSubmissionComments(token, submissionId) {
  const response = await fetch(`http://localhost:3000/comments/submission/${submissionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch comments');
  }
  
  return response.json();
}

// Add an annotation to a submission
async function addAnnotation(token, annotationData) {
  const response = await fetch('http://localhost:3000/annotations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      submissionId: annotationData.submissionId,
      pageNumber: annotationData.pageNumber,
      position: annotationData.position, // { x, y, width, height }
      metadata: annotationData.metadata // Custom JSON data
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add annotation');
  }
  
  return response.json();
}

// Get all annotations for a submission
async function getSubmissionAnnotations(token, submissionId) {
  const response = await fetch(`http://localhost:3000/annotations/submission/${submissionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch annotations');
  }
  
  return response.json();
}
```

## Common Integration Points

### User Registration and Authentication
- Login/logout flow
- User registration
- Password recovery
- Profile management

### Class Management
- Class creation and configuration
- Student enrollment
- Class archiving
- Class code generation and sharing

### Task Lifecycle
- Task creation
- Adding resources to tasks
- Publishing tasks
- Viewing and filtering tasks

### Submission Process
- File upload
- Submission creation and editing
- Submission state transitions
- Viewing submission history

### Comment System
- Adding comments to submissions
- Replying to existing comments
- Editing and deleting comments
- Viewing comment threads

### Annotation System
- Adding annotations to specific parts of submissions
- Attaching JSON metadata to annotations
- Positioning annotations on submission pages
- Filtering annotations by user or page

### Correction Workflow
- Reviewing submissions
- Adding comments and grades
- Correcting and returning work
- Viewing correction statistics

## Best Practices

1. **Token Management**:
   - Store tokens securely
   - Implement automatic token refresh
   - Clear tokens on logout

2. **Error Handling**:
   - Display user-friendly error messages
   - Implement retry logic for network failures
   - Log errors for debugging

3. **Form Validation**:
   - Validate inputs client-side using the same rules as the server
   - Show validation errors inline
   - Disable submit buttons until form is valid

4. **Performance**:
   - Implement data caching
   - Use pagination for large lists
   - Optimize file uploads (compression, chunking)

5. **Security**:
   - Sanitize user inputs
   - Protect against CSRF
   - Implement proper CORS handling
   - Never expose tokens in URLs

6. **Responsiveness**:
   - Implement optimistic UI updates
   - Show loading states during API calls
   - Handle offline scenarios gracefully

## API Documentation

For complete API details, access the Swagger documentation at:
```
http://localhost:3000/api-docs
```

This interactive documentation allows you to:
- See all available endpoints
- Understand request/response formats
- Test API calls directly
- View models and validation rules

## Troubleshooting

### Common Issues

1. **Authentication problems**:
   - Check token expiration
   - Verify correct token format in headers
   - Ensure user has required permissions

2. **File upload issues**:
   - Verify correct Content-Type header
   - Check file size limits
   - Confirm S3 bucket permissions

3. **404 errors**:
   - Verify endpoint URLs
   - Check that referenced resources exist
   - Confirm user has access to the resource

4. **Validation errors**:
   - Review API documentation for field requirements
   - Check data types and formats
   - Verify required fields are provided

### Getting Help

For additional assistance, contact the backend team via:
- Internal documentation
- Developer Slack channel
- Issue tracker

## Changelog and Versioning

The API follows semantic versioning. Check the backend repository for the latest changes and breaking changes.

Current version: 1.0.0 