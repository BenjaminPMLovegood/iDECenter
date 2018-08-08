const 
    serverSalt = require("../private_scripts/server_salt"),
    sha1 = require("../scripts/sha1"),
    usernameCheck = require("../scripts/check_username");

const
    NOT_EXISTS = 0,
    EXISTS = 1,
    SUPER = 2;

class UserCollection {
    constructor(db) {
        this._db = db;
        this._userTypeCache = {};
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

    async userExists(username) {
        if (typeof this._userTypeCache[username] !== "undefined") {
            return this._userTypeCache[username] != NOT_EXISTS;
        } else {
            return ((await this._getUserType(username)) != NOT_EXISTS);
        }
    }

    async isSuper(username) {
        if (typeof this._userTypeCache[username] !== "undefined") {
            return this._userTypeCache[username] == SUPER;
        } else {
            return ((await this._getUserType(username)) == SUPER);
        }
    }

    async _getUserType(username) {
        return new Promise(resolve => {
            if (typeof this._userTypeCache[username] == "undefined") {
                var cache = this._userTypeCache;
                var stmt = this._db.prepare("SELECT super FROM users WHERE username = ?");
                stmt.get(username, function(err, row) {
                    if (typeof row !== "undefined") {
                        cache[username] = row.super ? SUPER : EXISTS;
                    } else {
                        cache[username] = NOT_EXISTS;
                    }

                    resolve(cache[username]);
                })
            } else {
                resolve(this._userTypeCache[username]);
            }
        });
    }

    async addUser(username, passwordBrowserSalted, isSuper) {

    }
}

module.exports = UserCollection;
