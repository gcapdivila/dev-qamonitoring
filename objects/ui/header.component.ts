import { Page } from "@playwright/test";

export class HeaderComponent {
    constructor(private page: Page) {}

    async goToHomepage() {
        await this.page.getByRole('link', { name: 'Go to homepage' }).click()
    }

    async goToLogin() {
        await this.page.getByRole('menuitem', { name: 'Login' }).click()
    }

    async goToForm() {
        await this.page.getByRole('menuitem', { name: 'Form' }).click()
    }

    async goToTable() {
        await this.page.getByRole('menuitem', { name: 'Table' }).click()
    }

    async goToActions() {
        await this.page.getByRole('menuitem', { name: 'Actions' }).click()
    }

    async goToErrors() {
        await this.page.getByRole('menuitem', { name: 'Errors' }).click()
    }

    async goToVisual() {
        await this.page.getByRole('menuitem', { name: 'Visual' }).click()
    }

    async goToAbout() {
        await this.page.getByRole('menuitem', { name: 'About' }).click()
    }

    async goToAdmin() {
        await this.page.getByRole('menuitem', { name: 'Admin' }).click()
    }

    async isAdminVisible() {
        return await this.page.getByRole('menuitem', { name: 'Admin' }).count() > 0
    }

    async toggleTheme() {
        await this.page.getByRole('button', { name: 'Toggle dark mode' }).click();
        await this.page.waitForLoadState('domcontentloaded')
    }
}