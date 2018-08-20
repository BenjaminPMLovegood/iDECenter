const sqlite3 = require("sqlite3");
const fs = require("fs");

const config = require("./config.json");
const dbfile = config.database || "db.sqlite3";

if (fs.exists(dbfile)) {
    console.log("db already exists.");
    process.exit(1);
}

var db = new sqlite3.Database(dbfile);
db.exec(`
PRAGMA foreign_keys = 0;

CREATE TABLE users (
    id         INTEGER      PRIMARY KEY ASC ON CONFLICT ROLLBACK AUTOINCREMENT
                            NOT NULL
                            UNIQUE,
    username   VARCHAR (32) NOT NULL
                            UNIQUE ON CONFLICT ROLLBACK,
    password   CHAR (40)    NOT NULL,
    super      BOOLEAN      NOT NULL
                            DEFAULT (true),
    c9password CHAR (6)     NOT NULL
                            DEFAULT [000000]
);

CREATE TABLE projects (
    id          INTEGER      PRIMARY KEY ASC ON CONFLICT ROLLBACK AUTOINCREMENT
                             UNIQUE
                             NOT NULL,
    name        VARCHAR (32) NOT NULL,
    owner       INTEGER      NOT NULL
                             REFERENCES users (id),
    containerId VARCHAR (64) NOT NULL,
    port        INTEGER      NOT NULL
);

PRAGMA foreign_keys = 1;

INSERT INTO users (username, password, super, c9password) VALUES ("admin", "6a3529acdfb34355bb55f71de5ef30178d6ad123", 1, "000000"); 
`, function(err) {
    if (err != undefined) {
        console.log(err);
        process.exit(1);
    }
});
