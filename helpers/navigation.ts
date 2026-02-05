import { Page } from "@playwright/test";

export class NavigationHelper {
    constructor(private page: Page) {}

    async getCurrentPage() {
        const currentUrl = await this.page.url()
        switch(currentUrl.substring(currentUrl.lastIndexOf('/'))) {
            case 'index.html':
                return 'homePage';
                break;
            case 'login.html':
                return 'loginPage'
                break

        }
    }
}