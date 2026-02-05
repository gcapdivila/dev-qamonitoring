import { Page, expect as expectBase } from "@playwright/test";

export { test } from "@playwright/test"

export type PageName = 'homepage' | 'login' | 'form' | 'table' | 'actions' | 'errors' | 'visual' | 'about' | 'admin'

export const expect = expectBase.extend({
    async toBePage(received: Page, expectedPage: PageName ) {
        const pageMap: Record<PageName, string> = {
            homepage: '/index.html',
            login: '/login.html',
            form: '/form.html',
            table: '/table.html',
            actions: '/actions.html',
            errors: '/errors.html',
            visual: '/visual.html',
            about: '/about.html',
            admin: '/admin.html'
        }
        // const expectedPath = /\/pageMap[expectedPage](\?.*)?$/
        const expected = pageMap[expectedPage]
        const regex = new RegExp(`${expected}(\\?.*)?$`)
        try {
            await expectBase(received).toHaveURL(regex, { timeout: 5000 })
            return {
                message: () => 'passed',
                pass: true
            }
        } catch (error) {
            return {
                message: () => `Current page ${received.url()} doesn't match expected ${expected}`,
                pass: false
            }
        }
    },

    async toBeForbiddenPage(received: Page ) {
        const regex = /\/403\.html(\?.*)?$/
        try {
            await expectBase(received).toHaveURL(regex, { timeout: 5000 })
            return {
                message: () => 'passed',
                pass: true
            }
        } catch (error) {
            return {
                message: () => `Current page ${received.url()} is not a forbidden page as expected`,
                pass: false
            }
        }
    }
})
