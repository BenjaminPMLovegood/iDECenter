import { TemplateCollection } from "./template";
import { WorkspaceManager } from "./workspace_man";
import { Config } from "json-conf-m";
import { Docker } from "./docker";
import { DatabaseAssistant } from "./dba";
import { StdioDaemon } from "./daemon";
import { PassportStatic } from "passport";
import { Database } from "sqlite3";

export interface RoutesEnv {
    templates: TemplateCollection;
    workspaceManager: WorkspaceManager;
    config: Config;
    docker: Docker;
    db : Database;
    dba: DatabaseAssistant;
    daemon: StdioDaemon;
    passport: PassportStatic;
};