# Test Environment Documentation

## Integration Tests Setup

### Configuration Files
- `jest-integration.json`: Jest configuration for integration tests
- `mongodb-memory-server.ts`: MongoDB in-memory database setup
- `utils/test-app.ts`: Test application configuration and utilities

### Database Setup
The integration tests use `mongodb-memory-server` to create an in-memory MongoDB instance. This ensures:
- Tests run in isolation
- No need for an external database
- Fast execution
- Clean state between test runs

### Test Utilities

#### Database Management
```typescript
import { setupMongoDB, closeMongoDB, clearDatabase } from '../mongodb-memory-server';

// Initialize database
await setupMongoDB();

// Clean up after tests
await clearDatabase();

// Close database connection
await closeMongoDB();
```

#### Test Application
```typescript
import { TestApp } from '../utils/test-app';

// Create test application
const testApp = await TestApp.create();

// Clean database between tests
await testApp.clearDb();

// Close application
await testApp.close();
```

### Test Data Factories

Located in `test/factories/`:
- `user.factory.ts`: User data generation
- `class.factory.ts`: Class data generation
- `task.factory.ts`: Task data generation
- `submission.factory.ts`: Submission data generation

### Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test file
npm run test:integration -- path/to/test/file.int-spec.ts

# Run with coverage
npm run test:integration:cov
```

### Best Practices

1. **Test File Naming**
   - Integration test files should end with `.int-spec.ts`
   - Place in `test/integration/` directory
   - Group related tests in subdirectories

2. **Database Management**
   - Always clean up data between tests using `clearDatabase()`
   - Use `setupMongoDB()` in `beforeAll`
   - Use `closeMongoDB()` in `afterAll`

3. **Test Data**
   - Use factories to generate test data
   - Avoid hardcoding test data
   - Create minimal data required for each test

4. **API Testing**
   - Use `supertest` for HTTP requests
   - Test complete workflows
   - Verify response status codes and body
   - Test error cases and edge conditions

5. **Authentication**
   - Use `TestApp` utilities for authenticated requests
   - Test both authenticated and unauthenticated scenarios
   - Verify token handling and expiration

### Example Test Structure

```typescript
import { TestApp } from '../utils/test-app';
import { createUserDto } from '../factories/user.factory';

describe('AuthController (Integration)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await TestApp.create();
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await testApp.clearDb();
  });

  it('should authenticate user', async () => {
    // Test implementation
  });
});
``` 