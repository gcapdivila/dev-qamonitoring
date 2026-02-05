import { Page, Response } from "@playwright/test";
import { TestUser } from "@fixtures/data/test-users";
import { AuthStorage } from "@helpers/auth";

export interface LoginResult {
    status: number;
    response: Response;
    user: string | null;
    role: string | null;
    token: string | null;
}

export class LoginPage {
    constructor(private page: Page) {}

    loginButton() {
        return this.page.getByRole('button', { name: 'Login' });
    }

    async fillUsername(username: string) {
        await this.page.getByRole('textbox', { name: 'Username' }).fill(username)
    }

    async fillPassword(password: string) {
        await this.page.getByRole('textbox', { name: 'Password' }).fill(password)
    }

    async submitLogin(
        { waitForLogin = true }: { waitForLogin?: boolean } = {}
    ) {
        if (waitForLogin) {
            const responsePromise = this.page.waitForResponse(res => 
                res.url().includes("/api/login")
            );
            await this.loginButton().click();
            const response = await responsePromise
            return {
                response,
                status: response.status()
            }
        }

        await this.loginButton().click();
        return null;
    }

    async hasError(): Promise<string|null> {
        return await this.page.locator('#error').textContent();
    }

    async loginAs(user: TestUser) {
        await this.fillUsername(user.username);
        await this.fillPassword(user.password);
        const response = await this.submitLogin();
        const authStorage = new AuthStorage(this.page)
        const storage = await authStorage.waitUntilLoggedIn();
        return {
            status: response!.status,
            response: response!.response,
            user: storage.user,
            role: storage.role,
            token: storage.token
        } satisfies LoginResult
    }
}