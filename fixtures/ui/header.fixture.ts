import { HeaderComponent } from "@objects/ui/header.component";
import { test as testBase } from "../../expectations/custom-expect";

export { expect } from "../../expectations/custom-expect";

export const test = testBase.extend<{
    header: HeaderComponent;
}>({
    header: async ({ page }, use) => {
        await use(new HeaderComponent(page))
    }
})


