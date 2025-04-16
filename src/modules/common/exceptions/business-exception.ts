import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(
    message: string,
    errorCode: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    errorDetails?: Record<string, any>,
  ) {
    super(
      {
        message,
        errorCode,
        errorDetails,
      },
      statusCode,
    );
  }
}

// Common entity-related exceptions
export class EntityNotFoundException extends BusinessException {
  constructor(entityName: string, identifier: string) {
    super(
      `${entityName} with identifier ${identifier} was not found`,
      'ENTITY_NOT_FOUND',
      HttpStatus.NOT_FOUND,
    );
  }
}

export class EntityAlreadyExistsException extends BusinessException {
  constructor(entityName: string, identifier: string) {
    super(
      `${entityName} with identifier ${identifier} already exists`,
      'ENTITY_ALREADY_EXISTS',
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidStatusTransitionException extends BusinessException {
  constructor(entityName: string, currentStatus: string, targetStatus: string) {
    super(
      `Invalid status transition for ${entityName}: from ${currentStatus} to ${targetStatus}`,
      'INVALID_STATUS_TRANSITION',
      HttpStatus.BAD_REQUEST,
    );
  }
}

// Authorization exceptions
export class InsufficientPermissionsException extends BusinessException {
  constructor(permissionRequired: string) {
    super(
      `You don't have the required permission: ${permissionRequired}`,
      'INSUFFICIENT_PERMISSIONS',
      HttpStatus.FORBIDDEN,
    );
  }
}

export class InvalidCredentialsException extends BusinessException {
  constructor() {
    super(
      'Invalid credentials',
      'INVALID_CREDENTIALS',
      HttpStatus.UNAUTHORIZED,
    );
  }
}

// Validation exceptions
export class ValidationException extends BusinessException {
  constructor(errors: Record<string, any>) {
    super(
      'Validation errors in the request',
      'VALIDATION_ERROR',
      HttpStatus.BAD_REQUEST,
      errors,
    );
  }
}

// File-related exceptions
export class FileUploadException extends BusinessException {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      'FILE_UPLOAD_ERROR',
      HttpStatus.BAD_REQUEST,
      details,
    );
  }
}

export class FileSizeExceededException extends FileUploadException {
  constructor(maxSize: number) {
    super(
      `File size exceeds the maximum allowed limit (${maxSize} bytes)`,
      { maxSize },
    );
  }
}

export class InvalidFileTypeException extends FileUploadException {
  constructor(allowedTypes: string[]) {
    super(
      `Unauthorized file type. Accepted types: ${allowedTypes.join(', ')}`,
      { allowedTypes },
    );
  }
} 