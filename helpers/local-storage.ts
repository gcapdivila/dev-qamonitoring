import { Page } from "@playwright/test";

export class LocalStorageHelper {
    constructor(private page: Page) {}

    async get(key: string): Promise<string | null> {
        return this.page.evaluate(key => localStorage.getItem(key), key)
    }
}