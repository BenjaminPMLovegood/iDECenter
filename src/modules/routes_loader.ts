import { RoutesEnv } from "./routes_env";
import { Router } from "express";

export interface RoutesGenerator {
    (env: RoutesEnv): Router;
}


export function LoadRoutes(path: string): RoutesGenerator {
    return require(path).default;
}