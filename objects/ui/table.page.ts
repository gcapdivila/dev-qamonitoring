import { Page } from "@playwright/test";

export class TablePage {
    constructor(private page: Page) { }

    async addUser(name: string, role: 'Admin' | 'User' | 'Guest' ) {
        await this.page.getByRole('textbox', { name: 'Name (required)' }).fill(name);
        await this.page.getByRole('textbox', { name: 'Name (required)' }).selectOption(role);
        await this.page.getByRole('button', { name: 'Add' }).click()
    }

    async filterUserList(
        {name = "", role = "All roles", nbPerPage = 5}: 
        {name?: string, role?: 'All roles' | 'Admin' | 'User' | 'Guest', nbPerPage?: 5 | 10 | 20} = {}) {

            if (name) await this.page.getByRole('textbox', { name: 'Filter by name...' }).fill(name);
            this.page.locator('#filterRole').selectOption(role)
            this.page.locator('#pageSize').selectOption(`${nbPerPage} / page`)

    }

    async resetFilters() {
        this.page.getByRole('button', { name: 'Reset' }).click()
    }

    async getIdFromUsername(username: string) {
        const row = this.page.getByRole('row')
            .filter({ 
                has: this.page.getByRole('cell').nth(1).getByText(username, { exact: true }) 
            })
        const cellId = row.getByRole('cell').first()
        return await cellId.getAttribute('data-id')
    }

    async editUserByName(username: string, {newName = null, newRole = null}: {newName?: string | null, newRole?: string | null} = {}) {
        this.page.getByRole('row', { name: username }).getByRole('button').click()
        if (newName) this.page.locator('input[name="editName"]').fill(newName);
        if (newRole) this.page.locator('select[name="editRole"]').selectOption(newRole);
        this.page.getByRole('button', { name: 'Save' }).click()
    }
    
    async editUserById(id: number | string) {
        const row = this.page.getByRole('row')
            .filter({ 
                has: this.page.getByRole('cell').first().getByText('1', { exact: true }) 
            })
    }

    async previousPage() {
        this.page.getByRole('button', { name: 'Prev' }).click()
    }

    async nextPage() {
        this.page.getByRole('button', { name: 'Next' }).click()
    }

}