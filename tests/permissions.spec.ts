import { PageName } from "../expectations/custom-expect";
import { USERS } from "@fixtures/data/test-users";
import { expect, test } from "@fixtures/ui/login.fixture";
import { HeaderComponent } from "@objects/ui/header.component";

type PageDef = {
    name: PageName;
    action: (h: HeaderComponent) => Promise<void>;
}

test.describe("Permission of non logged user", {tag: ['@suite:smoke', '@domain:permissions']}, () => {

    const protectedPages: PageDef[] = [
        { name: "form", action: (h) => h.goToForm() },
        { name: "table", action: (h) => h.goToTable() },
        { name: "actions", action: (h) => h.goToActions() },
        { name: "errors", action: (h) => h.goToErrors() },
        { name: "visual", action: (h) => h.goToVisual() },
    ]

    for (const pageDef of protectedPages) {
        test(`Can't open page ${pageDef.name}`, async({ page, header, login }) => {
            await page.goto('/');
            await pageDef.action(header);
            await expect(page).toBePage('login')
            expect (await login.hasError()).toBe('Please login to access this page.')
        })
    }
    
    test("Can't open page admin", async ({ page, }) => {
        await page.goto('/admin.html');
        await expect(page).toBePage('login')
    })

    test("Can't see admin link", async ({ page, header }) => {
        await page.goto('/');
        expect (await header.isAdminVisible()).toBe(false)
    })

    test("Can open page about", async ({ page, header }) => {
        await page.goto('/');
        await header.goToAbout();
        await expect(page).toBePage('about')
    })
})

test.describe("Permission of editor", {tag: ['@suite:smoke', '@domain:permissions']}, () => {

    test.beforeEach('Login as an editor', async ({ page, loginAs }) => {
        await page.goto('/login.html');
        await loginAs(USERS.editor);
    })

    const allowedPages: PageDef[] = [
        { name: "form", action: (h) => h.goToForm() },
        { name: "table", action: (h) => h.goToTable() },
        { name: "actions", action: (h) => h.goToActions() },
        { name: "errors", action: (h) => h.goToErrors() },
        { name: "visual", action: (h) => h.goToVisual() },
    ]

    for (const pageDef of allowedPages) {
        test(`Can open page ${pageDef.name}`, async ({ page, header }) => {
            await pageDef.action(header)
            await expect(page).toBePage(pageDef.name)
        })
    }
    
    test("Can't open page admin", async ({ page }) => {
        await page.goto('/admin.html');
        await expect(page).toBeForbiddenPage()
    })

    test("Can't see admin link", async ({ page, header }) => {
        await page.goto('/');
        expect (await header.isAdminVisible()).toBe(false)
    })

})

test.describe("Permission of admin", {tag: ['@suite:smoke', '@domain:permissions']}, () => {

    test("Can access the admin", async ({ page, header, loginAs }) => {
        await page.goto('/login.html')
        await loginAs(USERS.admin)
        await header.goToAdmin()
        await expect(page).toBePage('admin')
    })

})
