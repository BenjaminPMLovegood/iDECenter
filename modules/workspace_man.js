const 
    fs = require("fs"),
    path = require("path");

class WorkspaceManager {
    constructor(workspace, archive, env) {
        this._workspace = workspace;
        this._archive = archive;
        this._daemon = env.daemon;
    }

    async ensureUserDir(username) {
        return new Promise((resolve, reject) => {
            var arg = { "@path" : this._workspace };
            arg[username] = { "@returnthis" : true };

            this._daemon.acall("projmgr", "ensuredir", { root : arg }).then(v => {
                if (v.path) resolve(v.path);
                else reject(v.error);
            });
        });
    }

    async ensureAuthDir(username, c9password, rewritePassword) {
        return new Promise((resolve, reject) => {
            var arg = { "@path" : this._workspace };
            arg[username] = {};
            arg[username][".auth"] = { "@returnthis" : true };
            arg[username][".auth"]["password"] = { "@isfile" : true, "@content" : `${username}:${c9password}`, "@overwrite" : rewritePassword };

            this._daemon.acall("projmgr", "ensuredir", { root : arg }).then(v => {
                if (v.path) resolve(v.path);
                else reject(v.error);
            });
        });
    }

    async ensureProjectDir(username, projectName) {
        return new Promise((resolve, reject) => {
            var arg = { "@path" : this._workspace };
            arg[username] = {};
            arg[username][projectName] = { "@returnthis" : true };

            this._daemon.acall("projmgr", "ensuredir", { root : arg }).then(v => {
                if (v.path) resolve(v.path);
                else reject(v.error);
            });
        });
    }

    async ensureArchiveDir(username, projectName, pid) {
        return new Promise((resolve, reject) => {
            var arg = { "@path" : this._archive };
            arg[username] = {};
            arg[username][projectName + "-" + pid] = { "@returnthis" : true };

            this._daemon.acall("projmgr", "ensuredir", { root : arg }).then(v => {
                if (v.path) resolve(v.path);
                else reject(v.error);
            });
        });
    }

    async deleteProjectDir(username, projectName) {
        var realthis = this;
        return new Promise((resolve, reject) => {
            realthis.ensureProjectDir(username, projectName).then(projDir => {
                realthis._daemon.acall("projmgr", "deletedir", { path : projDir }).then(v => {
                    if (v.path) resolve(v.path);
                    else reject(v.error);
                });
            });
        });
    }

    async archiveProjectDir(username, projectName, pid) {
        var realthis = this;
        return new Promise((resolve, reject) => {
            realthis.ensureProjectDir(username, projectName).then(projDir => {
                realthis.ensureArchiveDir(username, projectName, pid).then(archiDir => {
                    realthis._daemon.acall("projmgr", "movedir", { path : projDir, target : archiDir }).then(v => {
                        if (v.path) resolve(v.path);
                        else reject(v.error);
                    });
                });
            });
        });
    }
}

module.exports = WorkspaceManager;
