import { USERS } from '@fixtures/data/test-users';
import { test, expect } from '@fixtures/ui/login.fixture';
import { getRandomUser } from '@helpers/users';

test.describe('Verify happy path login', {tag: ['@domain:auth', '@suite:smoke', '@happypath']}, () => {
  test.beforeEach('Open login page', async({ page }) => {
    await page.goto('/login.html');
  })

  test('Login in the platform', async ({ loginAs }) => {
    const user = getRandomUser();
    const loginResponse = await loginAs(user);
    
    expect (loginResponse).not.toBeNull();
    expect (loginResponse.user).toBe(user.username);
    expect (loginResponse.role).toBe(user.role);
  });

})

test.describe('Verify login errors', {tag: ['@domain:auth', '@suite:regression', '@error']}, () => {
  const ERRORS = {
    incomplete: 'Please enter both username and password.',
    invalid: 'Invalid credentials'
  }

  test.beforeEach('Open login page', async({ page }) => {
    await page.goto('/login.html');
  })

  test('Empty fields ➡ validation error', async ({ login }) => {
    await login.submitLogin({waitForLogin: false});
    expect (await login.hasError()).toBe(ERRORS.incomplete);
  })

  test('Wrong password ➡ backend 401', async ({ page, login }) => {
    await login.fillUsername(USERS.admin.username);
    await login.fillPassword('Wrong password');
    const loginResponse = await login.submitLogin();
    expect(loginResponse!.status).toBe(401)
  })
})
