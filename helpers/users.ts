import { USERS, TestUser } from "@fixtures/data/test-users.js";

export function getRandomUser(): TestUser {
    const values = Object.values(USERS);
    return values[Math.floor(Math.random() * values.length)];
}