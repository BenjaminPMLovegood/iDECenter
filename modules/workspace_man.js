const 
    fs = require("fs"),
    path = require("path");

class WorkspaceManager {
    constructor(workspace) {
        this._workspace = workspace;
    }

    ensureUserDir(username, c9password, rewritePassword) {
        var userDir = path.join(this._workspace, username + "/");
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir);
        }

        var authDir = path.join(userDir, ".auth/");
        if (!fs.existsSync(authDir)) {
            fs.mkdir(authDir);
        }

        var authFile = path.join(authDir, "password");
        if (!fs.existsSync(authFile) || rewritePassword) {
            fs.writeFileSync(authFile, `${username}:${c9password}`, { encoding : "ascii", flag : "w" });
        }

        return userDir;
    }

    ensureProjectDir(username, projectName) {
        var userDir = path.join(this._workspace, username + "/");
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir);
        }

        var projDir = path.join(userDir, projectName + "/");
        if (!fs.existsSync(projDir)) {
            fs.mkdir(projDir);
        }

        return projDir;
    }
}

module.exports = WorkspaceManager;
