export interface Project {
    id: number;
    name: string;
    owner: number;
    containerId: string;
    port: number;
    createTimeUtc: string;
};

export interface User {
    id: number;
    usename: string;
    password: string;
    super: boolean;
    c9password: string;
    createTimeUtc: string;
};

export function isProject(x: object): x is Project {
    return false;
}
