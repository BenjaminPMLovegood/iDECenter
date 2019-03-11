import * as fs from "fs";
import * as path from "path";
import { StdioDaemon } from "./daemon";

interface EnsureDirResult { 
    path? : string,
    error? : any
};

interface EnsureDirParam {
    [ path: string ] : EnsureDirParam | string | boolean
}

export class WorkspaceManager {
    _workspace: string;
    _archive: string;
    _daemon: StdioDaemon;

    constructor(workspace: string, archive: string, daemon: StdioDaemon) {
        this._workspace = workspace;
        this._archive = archive;
        this._daemon = daemon;
    }

    public async ensureUserDir(username: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            var arg: EnsureDirParam = { "@path" : this._workspace };
            arg[username] = { "@returnthis" : true } as EnsureDirParam;

            this._daemon.acallt<EnsureDirResult>("projmgr", "ensuredir", { root : arg }).then(v => {
                if (v.path) resolve(v.path);
                else reject(v.error);
            });
        });
    }

    async ensureAuthDir(username: string, c9password: string, rewritePassword?: boolean): Promise<string> {
        return new Promise((resolve, reject) => {
            var arg: EnsureDirParam = { "@path" : this._workspace };
            var argUsername: EnsureDirParam = { ".auth" : { "@returnthis" : true, "password" : { "@isfile" : true, "@content" : `${username}:${c9password}`, "@overwrite" : !!rewritePassword } } };
            arg[username] = argUsername;

            this._daemon.acallt<EnsureDirResult>("projmgr", "ensuredir", { root : arg }).then(v => {
                if (v.path) resolve(v.path);
                else reject(v.error);
            });
        });
    }

    async ensureProjectDir(username: string, projectName: string): Promise<string> {
        return new Promise((resolve, reject) => {
            var arg: EnsureDirParam = { "@path" : this._workspace };
            var argUsername: EnsureDirParam = {};
            argUsername[projectName] = { "@returnthis" : true };
            arg[username] = argUsername;

            this._daemon.acallt<EnsureDirResult>("projmgr", "ensuredir", { root : arg }).then(v => {
                if (v.path) resolve(v.path);
                else reject(v.error);
            });
        });
    }

    async ensureArchiveDir(username: string, projectName: string, pid: number): Promise<string> {
        return new Promise((resolve, reject) => {
            var arg: EnsureDirParam = { "@path" : this._archive };
            var argUsername: EnsureDirParam = {};
            argUsername[projectName + "-" + pid] = { "@returnthis" : true };
            arg[username] = argUsername;

            this._daemon.acallt<EnsureDirResult>("projmgr", "ensuredir", { root : arg }).then(v => {
                if (v.path) resolve(v.path);
                else reject(v.error);
            });
        });
    }

    async deleteProjectDir(username: string, projectName: string): Promise<string> {
        var projDir = await this.ensureProjectDir(username, projectName);
        var v = await this._daemon.acallt<EnsureDirResult>("projmgr", "deletedir", { path : projDir });

        if (v.path) return v.path;
        else throw v.error;
    }

    async archiveProjectDir(username: string, projectName: string, pid: number): Promise<string> {
        var projDir = await this.ensureProjectDir(username, projectName);
        var archiDir = await this.ensureArchiveDir(username, projectName, pid);
        var v = await this._daemon.acallt<EnsureDirResult>("projmgr", "movedir", { path : projDir, target : archiDir });

        if (v.path) return v.path;
        else throw v.error;
    }
}
