export type Role = "admin" | "editor" | "guest";

// export interface TestUser {
//     username: string;
//     password: string;
//     role: Role;
// }

export const USERS = {
    admin: { username: "admin", password: "admin", role: "admin" },
    editor: { username: "editor", password: "editor", role: "editor" },
    user: { username: "user", password: "user", role: "user" }
} as const;

export type UserKey = keyof typeof USERS;
export type TestUser = typeof USERS[UserKey];