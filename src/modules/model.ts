export interface Project {
    id: number;
    name: string;
    owner: number;
    username: string;
    containerId: string;
    port: number;
    createTimeUtc: string;
};

export interface User {
    id: number;
    username: string;
    password: string;
    super: boolean;
    c9password: string;
    createTimeUtc: string;
};

export function isProject(x: object): x is Project {
    return true;
}

export type ProjectWithRunningInfo = Project & {
    running: boolean;
}
