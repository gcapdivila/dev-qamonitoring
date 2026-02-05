import { LocalStorageHelper } from "@helpers/local-storage";
import { test as testBase } from "../../expectations/custom-expect";

export const test = testBase.extend<{
    storage: LocalStorageHelper;
}>({
    storage: async ({ page }, use) => {
        await use(new LocalStorageHelper(page))
    }
})


