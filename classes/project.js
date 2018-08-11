const
    docker = require("../modules/docker");

class ProjectCollection {
    constructor(db) {
        this._db = db;
        this._projCache = {};
        /*
            this._projCache[id] = {
                id : xxx,
                name : xxx,
                ownerId : xxx,
                containerId : xxx,
                port : xxx
            }
        */
    }
}

module.exports = ProjectCollection;
