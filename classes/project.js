const
    docker = require("../modules/docker");

class ProjectCollection {
    constructor(db, baseport) {
        this._db = db;
        this._baseport = baseport;

        this._userCache = {};
        this._RunningCids = [];
        this._idToCid = {}; // Id to containerId, -1 for wrong Id
        this._cidToId = {}; // containerId to Id, -1 for wrong cid
    }

    isCidRunning(cid) {
        return this._RunningCids.includes(cid);
    }

    async refreshRunningStatus() {
        return this._RunningCids = (await docker.ps()).result || [];
    }

    async queryUsersProjects(uid) {
        // close caching temporarily
        // if (this._userCache[uid]) return this._userCache[uid];

        return new Promise(resolve => {
            var userCache = this._userCache;
            var realthis = this;
            this.refreshRunningStatus().then(idontcare => {
                realthis._db.all("SELECT id, name, containerId, port FROM projects WHERE owner = ?", uid, function(err, rows) {
                    if (err) {
                        userCache[uid] = [];
                    } else {
                        userCache[uid] = rows.map(function(row) { 
                            return { 
                                id : row.id, 
                                name : row.name, 
                                containerId : row.containerId, 
                                port : row.port, 
                                running : realthis.isCidRunning(row.containerId) 
                            };
                        });
                    }
    
                    resolve(userCache[uid]);
                });
            });
        });
    }

    async queryProjectInfo(pid) {
        return new Promise(resolve => {
            var realthis = this;
            this._db.get("SELECT name, containerId, owner, port FROM projects WHERE id = ?", pid, function(err, row) {
                if (err || !row) resolve(undefined);
                else {
                    resolve({
                        name : row.name,
                        containerId : row.containerId,
                        owner : row.owner,
                        port : row.port
                    });
                }
            });
        });
    }

    async _queryIdFromContainerId(cid) {
        if (this._cidToId[cid] !== undefined) return this._cidToId[cid];

        return new Promise(resolve => {
            var idCache = this._cidToId;
            this._db.get("SELECT id FROM projects WHERE containerId = ?", cid, function(err, row) {
                if (row == undefined) idCache[cid] = -1;
                else idCache[cid] = row.id;

                resolve(idCache[cid]);
            });
        });
    }

    async queryContainerId(pid) {
        if (this._idToCid[pid] !== undefined) return this._idToCid[pid];

        return new Promise(resolve => {
            var cidCache = this._idToCid;
            this._db.get("SELECT containerId FROM projects WHERE id = ?", pid, function(err, row) {
                if (row == undefined) cidCache[pid] = -1;
                else cidCache[pid] = row.containerId;

                resolve(cidCache[pid]);
            });
        });
    }

    async projExists(ownerId, projName) {
        if (!ownerId || !projName) return false;

        return new Promise(resolve => {
            this._db.get("SELECT id FROM projects WHERE ownerId = ? AND name = ?", ownerId, projName, function(err, row) {
                resolve(row != undefined);
            });
        });
    }

    // won't do anything in file system
    async createProjectInDB(ownerId, name, containerId) {
        this._userCache[ownerId] = undefined;

        return new Promise(resolve => {
            var baseport = this._baseport;
            this.projExists(ownerId, name).then(v => {
                if (v) {
                    resolve({ succeeded : false, error : "Project already exists." });
                } else {
                    this._db.run("INSERT INTO projects (name, owner, containerId, port) VALUES (?, ?, ?, ?)", name, ownerId, containerId, 0, function(err) {
                        if (err) {
                            resolve({ succeeded : false, error : err });
                        } else {
                            this._db.get("SELECT id FROM projects WHERE owner = ? AND name = ?", ownerId, name, function(err, row) {
                                if (err) {
                                    resolve({ succeeded : false, error : err });
                                } else {
                                    var id = row.id;
                                    var port = baseport + id;
        
                                    this._db.run("UPDATE projects SET port = ? WHERE id = ?", port, id, function(err) {
                                        if (err) {
                                            resolve({ succeeded : false, error : err });
                                        } else {
                                            resolve({ succeeded : true, pid : id });
                                        }
                                    });
                                }
                            })
                        }
                    });
                }
            });
        });
    }
}

module.exports = ProjectCollection;
