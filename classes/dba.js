const sqlitePromise = require("../modules/sqlite_promise");

class DatabaseAssistant {
    constructor(env) {
        this._db = env.db;
        this._dbp = sqlitePromise(this._db);
        this._docker = env._docker;
    }

    _addRunningInfoToProject(proj) {
        return Object.assign(proj, { running : this._docker.isCidRunning(proj.containerId) });
    }

    async getAllProjects() {
        return (await this._dbp.all("SELECT projects.*, users.username FROM projects, users WHERE users.id = projects.owner")).map(row => this._addRunningInfoToProject(row));
    }

    async getUserProjects(oid) {
        return (await this._dbp.all("SELECT * FROM projects WHERE owner = $oid", { $oid : oid })).map(row => this._addRunningInfoToProject(row));
    }

    async getProjectByPid(pid) {
        return this._addRunningInfoToProject(await this._dbp.get("SELECT * FROM projects WHERE id = $pid", { $pid : pid }));
    }

    async projectExists(oid, name) {
        return (await this._dbp.get("SELECT * FROM projects WHERE owner = $oid AND name = $name", { $pid : oid, $name : name })) != undefined;
    }

    async getMaxPid() {
        return (await this._dbp.get("SELECT MAX(id) AS maxpid FROM projects")).maxpid;
    }

    async createProjectInDB(oid, name, port, containerId) {
        if (await this.projectExists(oid, name)) throw "Project already exists.";

        await this._dbp.run("INSERT INTO projects (name, owner, containerId, port) VALUES ($name, $oid, $containerId, $port)", { $name : name, $owner : owner, $containerId : containerId, $port : port });
        return await this._dbp.get("SELECT id FROM projects WHERE owner = $oid AND name = $name", { $oid : oid, $name : name });
    }

    async deleteProjectInDB(pid) {
        await this._dbp.run("DELETE FROM projects WHERE id = $pid", { $pid : pid });
        return true;
    }
}

module.exports = DatabaseAssistant;
