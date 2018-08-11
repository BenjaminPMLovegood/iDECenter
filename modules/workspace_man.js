const 
    fs = require("fs"),
    path = require("path");

class WorkspaceManager {
    constructor(workspace) {
        this._workspace = workspace;
    }

    ensureUserDir(username, c9password) {
        var userDir = path.join(this._workspace, username + "/");
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir);
        }

        var authDir = path.join(userDir, ".auth");
    }
}

module.exports = WorkspaceManager;
