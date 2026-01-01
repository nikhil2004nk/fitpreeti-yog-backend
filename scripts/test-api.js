/**
 * Comprehensive API Test Script for Fitpreeti Yog Backend
 * Tests all endpoints on Vercel deployment
 * 
 * Usage: node scripts/test-api.js [baseUrl]
 * Example: node scripts/test-api.js https://fitpreeti-yog-backend.vercel.app
 */

const BASE_URL = process.argv[2] || 'https://fitpreeti-yog-backend.vercel.app';
const API_PREFIX = '/api/v1';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: [],
};

// Helper function to make HTTP requests
async function makeRequest(method, endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (options.body) {
    defaultOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, defaultOptions);
    let data;
    try {
      data = await response.json();
    } catch {
      data = { text: await response.text() };
    }
    return {
      status: response.status,
      ok: response.ok,
      data,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

// Test function
async function test(name, testFn) {
  results.total++;
  process.stdout.write(`\n${colors.cyan}[TEST ${results.total}]${colors.reset} ${name}... `);
  
  try {
    const result = await testFn();
    if (result.passed) {
      results.passed++;
      console.log(`${colors.green}✓ PASSED${colors.reset}`);
      if (result.message) {
        console.log(`   ${result.message}`);
      }
    } else {
      results.failed++;
      console.log(`${colors.red}✗ FAILED${colors.reset}`);
      console.log(`   ${colors.red}${result.message}${colors.reset}`);
      results.errors.push({ name, error: result.message });
    }
  } catch (error) {
    results.failed++;
    console.log(`${colors.red}✗ ERROR${colors.reset}`);
    console.log(`   ${colors.red}${error.message}${colors.reset}`);
    results.errors.push({ name, error: error.message });
  }
}

// Test suites
async function runTests() {
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}  Fitpreeti Yog Backend API Test Suite${colors.reset}`);
  console.log(`${colors.blue}  Testing: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);

  // ==================== ROOT & HEALTH ====================
  console.log(`\n${colors.yellow}📋 Root & Health Endpoints${colors.reset}`);
  
  await test('Root endpoint (/)', async () => {
    const res = await makeRequest('GET', '/');
    if (res.status === 200 && res.data.success) {
      return { passed: true, message: `API Info: ${res.data.message}` };
    }
    return { passed: false, message: `Expected 200, got ${res.status}` };
  });

  await test('Health check endpoint', async () => {
    const res = await makeRequest('GET', `${API_PREFIX}/health`);
    if (res.status === 200 && res.data.success) {
      const dbStatus = res.data.data?.database || 'unknown';
      return { 
        passed: true, 
        message: `Status: ${res.data.data?.status}, Database: ${dbStatus}` 
      };
    }
    return { passed: false, message: `Expected 200, got ${res.status}` };
  });

  // ==================== PUBLIC ENDPOINTS ====================
  console.log(`\n${colors.yellow}📋 Public Endpoints${colors.reset}`);
  
  await test('Get all services', async () => {
    const res = await makeRequest('GET', `${API_PREFIX}/services`);
    if (res.status === 200 && res.data.success) {
      const count = res.data.data?.length || 0;
      return { passed: true, message: `Found ${count} services` };
    }
    return { passed: false, message: `Expected 200, got ${res.status}` };
  });

  await test('Get all trainers', async () => {
    const res = await makeRequest('GET', `${API_PREFIX}/trainers`);
    if (res.status === 200 && res.data.success) {
      const count = res.data.data?.length || 0;
      return { passed: true, message: `Found ${count} trainers` };
    }
    return { passed: false, message: `Expected 200, got ${res.status}` };
  });

  await test('Get reviews', async () => {
    const res = await makeRequest('GET', `${API_PREFIX}/reviews`);
    if (res.status === 200) {
      return { passed: true, message: 'Reviews endpoint accessible' };
    }
    return { passed: false, message: `Expected 200, got ${res.status}` };
  });

  // ==================== AUTHENTICATION ====================
  console.log(`\n${colors.yellow}🔐 Authentication Endpoints${colors.reset}`);
  
  let testUser = {
    name: `Test User ${Date.now()}`,
    phone: `+91${Math.floor(Math.random() * 10000000000)}`,
    pin: '123456',
    email: `test${Date.now()}@example.com`,
  };

  await test('Register new user', async () => {
    const res = await makeRequest('POST', `${API_PREFIX}/auth/register`, {
      body: testUser,
    });
    if (res.status === 201 && res.data.success) {
      return { passed: true, message: `User registered: ${testUser.phone}` };
    }
    if (res.status === 409) {
      return { passed: true, message: 'User already exists (expected for duplicate)' };
    }
    return { 
      passed: false, 
      message: `Expected 201, got ${res.status}. ${JSON.stringify(res.data)}` 
    };
  });

  await test('Login with credentials', async () => {
    const res = await makeRequest('POST', `${API_PREFIX}/auth/login`, {
      body: {
        phone: testUser.phone,
        pin: testUser.pin,
      },
    });
    // Accept both 200 and 201 as success (201 might be returned if user auto-registered)
    if (res.status === 200 || res.status === 201) {
      const hasCookies = res.headers['set-cookie'] || [];
      return { 
        passed: true, 
        message: `Login successful (${res.status}). Cookies set: ${hasCookies.length > 0 ? 'Yes' : 'No'}` 
      };
    }
    return { 
      passed: false, 
      message: `Expected 200/201, got ${res.status}. ${JSON.stringify(res.data)}` 
    };
  });

  await test('Login with invalid credentials', async () => {
    const res = await makeRequest('POST', `${API_PREFIX}/auth/login`, {
      body: {
        phone: 'invalid',
        pin: '000000',
      },
    });
    // Accept 400 (validation), 401 (auth), or 429 (rate limit) as correct rejection
    if (res.status === 400 || res.status === 401 || res.status === 429) {
      return { passed: true, message: `Correctly rejected invalid credentials (${res.status})` };
    }
    return { passed: false, message: `Expected 400/401/429, got ${res.status}` };
  });

  // ==================== PROTECTED ENDPOINTS ====================
  console.log(`\n${colors.yellow}🔒 Protected Endpoints (Expected to fail without auth)${colors.reset}`);
  
  await test('Get class schedule (requires auth)', async () => {
    const res = await makeRequest('GET', `${API_PREFIX}/class-schedule`);
    if (res.status === 401) {
      return { passed: true, message: 'Correctly requires authentication' };
    }
    return { passed: false, message: `Expected 401, got ${res.status}` };
  });

  await test('Get user bookings (requires auth)', async () => {
    const res = await makeRequest('GET', `${API_PREFIX}/bookings`);
    if (res.status === 401) {
      return { passed: true, message: 'Correctly requires authentication' };
    }
    return { passed: false, message: `Expected 401, got ${res.status}` };
  });

  await test('Get user profile (requires auth)', async () => {
    const res = await makeRequest('GET', `${API_PREFIX}/auth/profile`);
    if (res.status === 401) {
      return { passed: true, message: 'Correctly requires authentication' };
    }
    return { passed: false, message: `Expected 401, got ${res.status}` };
  });

  // ==================== SUMMARY ====================
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}  Test Summary${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`Total Tests: ${results.total}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.errors.length > 0) {
    console.log(`\n${colors.red}Errors:${colors.reset}`);
    results.errors.forEach((err, idx) => {
      console.log(`${idx + 1}. ${err.name}: ${err.error}`);
    });
  }

  console.log(`\n${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});

