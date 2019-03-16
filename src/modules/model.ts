import { Request } from "express";

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

export interface ProjectFilterOptions {
    namePattern?: string;
    owner?: number;
    earliestCreateTimeUtc?: Date;
    latestCreateTimeUtc?: Date;
};

export function getProjectFilterOptionsFromRequest(req: Request): ProjectFilterOptions {
    var rv: ProjectFilterOptions = {};

    if (req.body.filter != undefined) {
        if (req.body.filter.namePattern) rv.namePattern = req.body.filter.namePattern;
        if (req.body.filter.owner) rv.owner = req.body.filter.owner;
        if (req.body.filter.earliestCreateTimeUtc) rv.earliestCreateTimeUtc = new Date(req.body.filter.earliestCreateTimeUtc);
        if (req.body.filter.latestCreateTimeUtc) rv.latestCreateTimeUtc = new Date(req.body.filter.latestCreateTimeUtc);
    }

    return rv;
}
