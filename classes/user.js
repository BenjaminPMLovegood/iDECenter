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

            var stmt = this._db.prepare("SELECT id, username, super FROM users WHERE username = ? AND password = ?");
            stmt.get(username, newPassword, function(err, row) {
                if (typeof row !== "undefined") {
                    resolve({ id : row.id, username : row.username, super : row.super });
                } else {
                    resolve(void 0);
                }
            });
            stmt.finalize();
        });
    }

    async userExists(userId) {
        if (this._userCache[userId] !== undefined) {
            return this._userCache[userId] !== null;
        } else {
            return ((await this.getUserInfo(userId)) !== null);
        }
    }

    async isSuper(userId) {
        if (this._userCache[userId] !== undefined) {
            if (this._userCache[userId] === null) return false;
            return this._userCache[userId].super;
        } else {
            var info = await this.getUserType(userId);
 
            if (info === null) return false;
            return info.super;
        }
    }

    async getUsername(userId) {
        if (this._userCache[userId] !== undefined) {
            if (this._userCache[userId] === null) return undefined;
            return this._userCache[userId].username;
        } else {
            var info = await this.getUserType(userId);
 
            if (info === null) return undefined;
            return info.username;
        }
    }

    // return null instead of undefined when required user info does not exists
    async getUserInfo(userId) {
        return new Promise(resolve => {
            if (this._userCache[userId] !== undefined) {
                resolve(this._userCache[userId]);
            } else {
                var cache = this._userCache;
                var stmt = this._db.prepare("SELECT username, super, c9password FROM users WHERE id = ?");
                stmt.get(userId, function(err, row) {
                    if (row !== undefined) {
                        cache[userId] = { username : row.username, super : row.super, c9password : row.c9password };
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
            this._getUserType(username).then(v => {
                if (v !== NOT_EXISTS) {
                    resolve({ succeeded : false, error : "User already exists." });
                } else {
                    var password = sha1(serverSalt(username, passwordBrowserSalted));

                    var stmt = this._db.prepare("INSERT INTO users (username, password, super, c9password) VALUES (?, ?, ?, ?)");
                    stmt.run(username, password, isSuper, c9password, function(err) {
                        if (err == undefined) resolve({ succeeded : false, error : err });
                        else {
                            resolve({ succeeded : true });
                        }
                    })
                    stmt.finalize();
                }
            });
        });
    }
}

module.exports = UserCollection;
