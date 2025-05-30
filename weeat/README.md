# WE EAT - Frontend Testing Suite

This project contains comprehensive Jest tests for the WE EAT frontend application built with Next.js, React, and TypeScript.

## Testing Framework

- **Jest**: JavaScript testing framework
- **React Testing Library**: Testing utilities for React components
- **JSDOM**: Browser environment simulation
- **Babel**: JavaScript compilation for tests

## Test Configuration

### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/*.stories.{js,jsx,ts,tsx}',
    '!app/globals.css',
    '!app/favicon.ico'
  ],
};
```

### Jest Setup (`jest.setup.js`)
- Imports `@testing-library/jest-dom` for custom matchers
- Provides polyfills for TextEncoder/TextDecoder
- Mocks console methods for cleaner test output

## Tested Components

### 1. **UserProfileEditor** (`UserProfileEditor.test.tsx`)
Tests for the user profile editing functionality:
- ✅ Component rendering with correct elements
- ✅ Loading user data from API on mount
- ✅ Fallback to localStorage when API fails
- ✅ Editing user name, email, and phone
- ✅ Canceling edits and reverting changes
- ✅ Error handling for update failures
- ✅ Logout functionality
- ✅ Loading states and authentication checks
- ✅ Success notifications

**Key Features Tested:**
- API integration with authentication
- Form validation and editing states
- Error handling and notifications
- LocalStorage fallback mechanism

### 2. **ShoppingCart** (`ShoppingCart.test.tsx`)
Tests for the shopping cart functionality:
- ✅ Cart button rendering
- ✅ Opening and closing cart
- ✅ Loading cart items on mount
- ✅ Displaying cart items with correct data
- ✅ Price calculations
- ✅ Quantity updates (increase/decrease)
- ✅ Item removal when quantity reaches zero
- ✅ Checkout process
- ✅ Empty cart state
- ✅ Authentication error handling
- ✅ Cart item count badge
- ✅ Loading states and network errors
- ✅ Token validation
- ✅ Event listeners for cart updates

**Key Features Tested:**
- Multiple axios instances (order and catalog APIs)
- Interceptor setup for authentication
- Real-time cart updates via events
- Complex state management

### 3. **Wallet** (`Wallet.test.tsx`)
Tests for the wallet/payment management:
- ✅ Wallet page rendering with header
- ✅ Loading and displaying cards
- ✅ Loading states while fetching
- ✅ Error handling for API failures
- ✅ Card number visibility toggle
- ✅ Add card form opening
- ✅ Form validation (empty fields, card number format)
- ✅ Successful card addition
- ✅ Card addition error handling
- ✅ Card deletion functionality
- ✅ Card deletion error handling
- ✅ Form cancellation
- ✅ Authentication checks
- ✅ Card number formatting and masking
- ✅ Empty state display

**Key Features Tested:**
- Card management CRUD operations
- Form validation with real-time feedback
- Secure card number display
- Authentication and authorization

### 4. **Ubication** (`Ubication.test.tsx`)
Tests for the location management:
- ✅ Page rendering with correct elements
- ✅ Redirect to login when unauthenticated
- ✅ Existing location display and management
- ✅ Manual address input
- ✅ Error clearing on user input
- ✅ Location saving functionality
- ✅ Empty address validation
- ✅ Continuing with existing location
- ✅ Location change functionality
- ✅ Geolocation API integration
- ✅ Permission handling (denied, unavailable)
- ✅ Geocoding API integration and fallbacks
- ✅ Loading states during operations
- ✅ Error handling for missing user data
- ✅ Address building from geocoding components

**Key Features Tested:**
- Geolocation API integration
- External geocoding service
- Navigation and routing
- Complex state management

## Existing Tests (Legacy)

### 5. **Background** (`Background.test.tsx`)
Tests for the animated background component.

### 6. **Catalog** (`Catalog.test.tsx`)
Tests for the product catalog functionality.

### 7. **Header** (`Header.test.tsx`)
Tests for the navigation header component.

### 8. **Login** (`Login.test.tsx`)
Tests for the login functionality.

### 9. **Register** (`Register.test.tsx`)
Tests for the user registration.

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test File
```bash
npm test -- __tests__/UserProfileEditor.test.tsx
npm test -- __tests__/ShoppingCart.test.tsx
npm test -- __tests__/Wallet.test.tsx
npm test -- __tests__/Ubication.test.tsx
```

### Tests with Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm test -- --watch
```

### Tests Matching Pattern
```bash
npm test -- --testNamePattern="renders"
npm test -- --testNamePattern="handles error"
```

## Mocking Strategy

### External Dependencies
- **Axios**: Mocked with proper interceptor setup
- **Next.js Router**: Mocked with navigation functions
- **Framer Motion**: Simplified component mocks
- **Lucide React Icons**: Test-friendly icon mocks

### Browser APIs
- **localStorage**: Complete mock implementation
- **Geolocation API**: Mock with success/error scenarios
- **Fetch API**: Mock for external service calls
- **Event Listeners**: Mock for component cleanup testing

### Component Dependencies
- **Header**: Mocked for isolated testing
- **Background**: Mocked for performance

## Test Patterns

### Common Test Structure
1. **Setup**: Mock external dependencies and localStorage
2. **Render**: Mount component with React Testing Library
3. **Act**: Simulate user interactions
4. **Assert**: Verify expected behavior
5. **Cleanup**: Reset mocks between tests

### Authentication Testing
All components that require authentication are tested with:
- Valid authentication scenarios
- Missing token/userId scenarios
- API authentication failures
- Token format validation

### Error Handling
Comprehensive error testing includes:
- Network failures
- API errors with specific status codes
- Invalid data formats
- Missing required parameters
- User permission issues

### Loading States
Tests verify:
- Initial loading indicators
- Loading during async operations
- Proper cleanup after operations complete
- User feedback during long operations

## Coverage Goals

The test suite aims for:
- **Statements**: >90%
- **Branches**: >85%
- **Functions**: >90%
- **Lines**: >90%

## Test Data

### Mock User Data
```javascript
const mockUserData = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  phone: '123456789'
};
```

### Mock Authentication
```javascript
mockLocalStorage.setItem('token', 'fake-token');
mockLocalStorage.setItem('userId', '1');
mockLocalStorage.setItem('userData', JSON.stringify(mockUserData));
```

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on others
2. **Realistic Mocks**: Mocks behave like real APIs
3. **User-Centric**: Tests focus on user interactions and outcomes
4. **Error Coverage**: Both happy path and error scenarios are tested
5. **Async Handling**: Proper handling of promises and async operations
6. **Cleanup**: Proper mock reset between tests

## Troubleshooting

### Common Issues

1. **Axios Interceptor Errors**
   - Ensure axios.create is properly mocked
   - Mock interceptors with proper return values

2. **Component Not Found**
   - Check component import paths
   - Verify mock implementations

3. **Async Test Failures**
   - Use `waitFor` for async operations
   - Increase timeout for slow operations

4. **Mock Reset Issues**
   - Clear all mocks in `beforeEach`
   - Reset localStorage between tests

### Debug Commands
```bash
# Run tests with verbose output
npm test -- --verbose

# Run tests with coverage report
npm test -- --coverage

# Run specific test file with watch mode
npm test -- __tests__/Wallet.test.tsx --watch
```

## Contributing

When adding new tests:
1. Follow the existing naming conventions
2. Include both positive and negative test cases
3. Mock external dependencies appropriately
4. Add proper TypeScript types for mocks
5. Update this README with new test descriptions

## Dependencies

### Test Dependencies
- `@testing-library/jest-dom`: ^6.6.3
- `@testing-library/react`: ^16.3.0
- `@testing-library/user-event`: ^14.6.1
- `@types/jest`: ^29.5.14
- `jest`: ^29.7.0
- `jest-environment-jsdom`: ^29.7.0
- `identity-obj-proxy`: ^3.0.0

### Runtime Dependencies Being Tested
- `axios`: ^1.8.4
- `framer-motion`: ^12.9.1
- `lucide-react`: ^0.487.0
- `next`: 15.2.4
- `react`: ^19.0.0
- `react-dom`: ^19.0.0
