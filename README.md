# Metacopi Backend

A comprehensive backend API for the Metacopi platform - a digital solution for classroom management, task assignment, submission handling, and correction workflows.

## Overview

Metacopi Backend is a robust API built with NestJS and MongoDB that serves as the foundation for the Metacopi platform. It provides a complete set of features for educational institutions to manage classes, assignments, submissions, and corrections in a digital environment.

## Features

- **User Management**: Authentication, authorization, and role-based access control (Admin, Teacher, Student)
- **Class Management**: Create and manage classes with unique join codes
- **Task Management**: Create, publish, and archive assignments
- **Submission System**: Allow students to submit their work with support for both raw and processed pages
- **Correction Workflow**: Enable teachers to review and grade submissions
- **Comment System**: Add comments to submissions for feedback and discussion
- **Annotation System**: Attach annotations to specific parts of submissions with JSON metadata
- **Resource Management**: Attach various resources (files, links, text) to tasks
- **Audit Logging**: Track important actions across the system
- **S3 Integration**: Store and retrieve files using Amazon S3
- **API Documentation**: Comprehensive Swagger documentation

## Technology Stack

- **Framework**: NestJS
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with Passport
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **File Storage**: AWS S3
- **Testing**: Jest

## API Endpoints

The API includes comprehensive endpoints for all entities:

- **Authentication**: `/auth/login`, `/auth/refresh`, `/auth/profile`
- **Users**: CRUD operations at `/users`
- **Classes**: Management at `/classes` including code generation and joining
- **Memberships**: Manage class memberships at `/memberships`
- **Tasks**: Create and manage tasks at `/tasks`
- **Submissions**: Handle student submissions at `/submissions`
- **Corrections**: Review and grade submissions at `/corrections`
- **Comments**: Create and manage comments on submissions at `/comments`
- **Annotations**: Add and manage annotations on submissions at `/annotations`
- **Storage**: Handle file uploads and downloads at `/storage`
- **Audit Logs**: Track system activities at `/logs`
- **Task Resources**: Manage resources attached to tasks at `/task-resources`

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- AWS S3 account (for file storage)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on the `.env.example`
4. Start the development server:
   ```
   npm run start:dev
   ```

### Testing

The project includes comprehensive test coverage:

```
# Run all tests
npm test

# Run integration tests
npm run test:integration

# Run with coverage report
npm run test:cov
```

## API Documentation

Once the server is running, you can access the Swagger documentation at:

```
http://localhost:3000/api-docs
```

This provides a complete interactive documentation of all API endpoints.

## Project Structure

```
src/
├── modules/            # Feature modules
│   ├── users/          # User management
│   ├── classes/        # Class management
│   ├── tasks/          # Task management
│   ├── submissions/    # Submission handling
│   ├── corrections/    # Correction workflows
│   ├── comments/       # Comment functionality
│   ├── annotations/    # Annotation functionality
│   └── ...
├── common/             # Shared code
├── config/             # Configuration
└── interfaces/         # TypeScript interfaces
```

## License

This software is proprietary and confidential. Unauthorized copying, transferring, or reproduction of the contents of this software, via any medium, is strictly prohibited. All rights reserved by Edukera SAS.

© 2025 Edukera SAS. All rights reserved.
