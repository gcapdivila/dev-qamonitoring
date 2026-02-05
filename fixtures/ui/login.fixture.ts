import { test as testBase } from "@fixtures/ui/header.fixture";
import { LoginPage } from "@objects/ui/login.page";

export { expect } from "@fixtures/ui/header.fixture";

export const test = testBase.extend<{
    login: LoginPage;
    loginAs: (user: any) => Promise<any>;
}>({
    login: async ({ page }, use) => {
        await use(new LoginPage(page));
    },

    loginAs: async({ login }, use) => {
        await use(async (user) => {
            return await login.loginAs(user);
        })
    }
});
