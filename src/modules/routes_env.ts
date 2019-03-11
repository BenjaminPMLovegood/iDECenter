import { TemplateCollection } from "./template";
import { WorkspaceManager } from "./workspace_man";
import { Config } from "json-conf-m";
import { Docker } from "./docker";
import { DatabaseAssistant } from "./dba";

export interface RoutesEnv {
    templates: TemplateCollection;
    workspaceManager: WorkspaceManager;
    config: Config;
    docker: Docker;
    dba: DatabaseAssistant;
};