const 
    serverSalt = require("../modules/server_salt"),
    sha1 = require("../scripts/sha1"),
    usernameCheck = require("../scripts/check_username");

class UserCollection {
    constructor(db) {
        this._db = db;
        this._userCache = {}; // null : user not exists
    }

    async verify(username, passwordBrowserSalted) {
        return new Promise(resolve => {
            if (!usernameCheck(username)) return resolve(void 0);

            var newPassword = sha1(serverSalt(username, passwordBrowserSalted));

            this._db.get("SELECT * FROM users WHERE username = ? AND password = ?", username, newPassword, function(err, row) {
                if (typeof row !== "undefined") {
                    resolve({ id : row.id, username : row.username, super : row.super, c9password : row.c9password });
                } else {
                    resolve(void 0);
                }
            });
        });
    }

    async userExists(userId) {
        if (this._userCache[userId] !== undefined) {
            return this._userCache[userId] !== null;
        } else {
            return ((await this._getUserInfoCache(userId)) !== null);
        }
    }

    async usernameExists(username) {
        return new Promise(resolve => {
            this._db.get("SELECT * FROM users WHERE username = ?", username, function(err, row) {
                if (typeof row !== "undefined") {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
    }

    async isSuper(userId) {
        if (this._userCache[userId] !== undefined) {
            if (this._userCache[userId] === null) return false;
            return this._userCache[userId].super;
        } else {
            var info = await this._getUserInfoCache(userId);
 
            if (info === null) return false;
            return info.super;
        }
    }

    async getUsername(userId) {
        if (this._userCache[userId] !== undefined) {
            if (this._userCache[userId] === null) return undefined;
            return this._userCache[userId].username;
        } else {
            var info = await this._getUserInfoCache(userId);
 
            if (info === null) return undefined;
            return info.username;
        }
    }

    async getUserInfo(userId) {
        return Object.assign({}, await this._getUserInfoCache(userId));
    }

    // return null instead of undefined when required user info does not exists
    // don't change the returned value, or you'll ruin the cache
    async _getUserInfoCache(userId) {
        return new Promise(resolve => {
            if (this._userCache[userId] !== undefined) {
                resolve(this._userCache[userId]);
            } else {
                var cache = this._userCache;
                this._db.get("SELECT id, username, super, c9password FROM users WHERE id = ?", userId, function(err, row) {
                    if (row != undefined) {
                        cache[userId] = { id : row.id, username : row.username, super : row.super, c9password : row.c9password };
                    } else {
                        cache[userId] = null;
                    }

                    resolve(cache[userId]);
                });
            }
        });
    }

    async addUser(username, passwordBrowserSalted, isSuper, c9password) {
        if (!usernameCheck(username)) return false;

        return new Promise(resolve => {
            this.usernameExists(username).then(v => {
                if (v) {
                    resolve({ succeeded : false, error : "User already exists." });
                } else {
                    var password = sha1(serverSalt(username, passwordBrowserSalted));

                    this._db.run("INSERT INTO users (username, password, super, c9password, createTimeUtc) VALUES (?, ?, ?, ?, ?)", username, password, isSuper, c9password, new Date().toISOString(), function(err) {
                        if (err != undefined) resolve({ succeeded : false, error : err });
                        else {
                            resolve({ succeeded : true });
                        }
                    })
                }
            });
        });
    }

    async getAllUsers() {
        return new Promise(resolve => {
            this._db.all("SELECT id, username, super, c9password, createTimeUtc FROM users", function(err, rows) {
                resolve(rows.map(function(row) {
                    return {
                        id : row.id,
                        username : row.username,
                        super : !!(row.super),
                        c9password : row.c9password,
                        createTimeUtc : row.createTimeUtc
                    };
                }));
            });
        });
    }
}

module.exports = UserCollection;
