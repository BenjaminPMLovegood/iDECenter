

class ProjectCollection {
    constructor(db) {
        this._db = db;
        this._projInfos = [];
        /* 
        [
            {
                name : xxx,
                containerId : xxx,
                ownerId : xxx,
                ownerName : xxx
            },
            ......
        ] 
        */
    }
}

module.exports = ProjectCollection;
