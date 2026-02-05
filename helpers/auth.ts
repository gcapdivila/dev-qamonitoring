import { Page } from "playwright/test";

export interface AuthState {
    user: string | null;
    role: string | null;
    token: string | null;
}

export class AuthStorage {
    constructor(private page: Page) {}

    async getAuthState(): Promise<AuthState> {
        const [user, role, token] = await Promise.all([
            this.page.evaluate(() => localStorage.getItem("user")),
            this.page.evaluate(() => localStorage.getItem("role")),
            this.page.evaluate(() => localStorage.getItem("token")),
        ]);

        return { user, role, token}
    }

    async waitUntilLoggedIn(expectedUrl: string = "**/actions.html") {
        await this.page.waitForURL(expectedUrl, { timeout: 5000 });
        await this.page.waitForLoadState("domcontentloaded");
        return await this.getAuthState();
    }
}
