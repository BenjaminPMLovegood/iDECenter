import { Database } from "sqlite3";
import { Logger } from "log4js";

import sqlitePromise, { DatabasePromised } from "./sqlite_promise";
import serverSalt from "./server_salt";
import { hex_sha1 as sha1 } from "./sha1";
import { checkUsername as usernameCheck } from "./check_username";
import Docker from "./docker"

import { Project, User } from "./model"

export default class DatabaseAssistant {
    _db: Database;
    _dbp: DatabasePromised;
    _docker: Docker;

    constructor(db: Database, logger: Logger, docker: Docker) {
        this._db = db;
        this._dbp = sqlitePromise(this._db, logger);
        this._docker = docker;
    }

    // projects
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
        return (await this._dbp.get("SELECT * FROM projects WHERE owner = $oid AND name = $name", { $oid : oid, $name : name })) != undefined;
    }

    async getMaxPid(): Promise<number> {
        return (await this._dbp.get("SELECT MAX(id) AS maxpid FROM projects")).maxpid;
    }

    async createProjectInDB(oid, name, port, containerId) {
        if (await this.projectExists(oid, name)) throw "Project already exists.";

        await this._dbp.run("INSERT INTO projects (name, owner, containerId, port, createTimeUtc) VALUES ($name, $oid, $containerId, $port, $createTime)", { $name : name, $oid : oid, $containerId : containerId, $port : port, $createTime : new Date().toISOString() });
        return await this._dbp.get("SELECT id FROM projects WHERE owner = $oid AND name = $name", { $oid : oid, $name : name });
    }

    async deleteProjectInDB(pid: number): Promise<void> {
        await this._dbp.run("DELETE FROM projects WHERE id = $pid", { $pid : pid });
        return true;
    }

    // users
    async verifyUser(username, passwordBrowserSalted) {
        if (!usernameCheck(username)) throw "Invalid username";
        var passwordSalted = sha1(serverSalt(username, passwordBrowserSalted));

        var result = await this._dbp.get("SELECT * FROM users WHERE username = $username AND password = $password", { $username : username, $password : passwordSalted });
        if (result) {
            result.super = !!(result.super);
            return Object.assign({}, result);
        } else {
            throw "Invalid username or password";
        }
    }

    async userExists(uid) {
        return (await this._dbp.get("SELECT * FROM users WHERE id = $uid", { $uid : uid })) != undefined;
    }

    async usernameExists(username) {
        return (await this._dbp.get("SELECT * FROM users WHERE username = $username", { $username : username })) != undefined;
    }

    async getUidByUsername(username: string): Promise<number | undefined> {
        var userinfo = await this._dbp.get("SELECT id FROM users WHERE username = $username", { $username : username });

        if (userinfo) {
            return userinfo.id;
        } else {
            return undefined;
        }
    }

    async getUserById(uid) {
        var userinfo = await this._dbp.get("SELECT * FROM users WHERE id = $uid", { $uid : uid });
        return Object.assign({}, userinfo);
    }

    async addUser(username: string, passwordBrowserSalted: string, isSuper: boolean, c9password: string): Promise<boolean> {
        if (await this.usernameExists(username)) throw "User already exists";

        var passwordSalted = sha1(serverSalt(username, passwordBrowserSalted));

        await this._dbp.run("INSERT INTO users (username, password, super, c9password, createTimeUtc) VALUES ($username, $password, $super, $c9password, $createTime)", { $username : username, $password : passwordSalted, $super : isSuper, $c9password : c9password, $createTime : new Date().toISOString() });
        return true;
    }

    async getAllUsers() {
        return (await this._dbp.all("SELECT * FROM users")).map(function(row) {
            row.super = !!(row.super);
            return row;
        });
    }
}

module.exports = DatabaseAssistant;
