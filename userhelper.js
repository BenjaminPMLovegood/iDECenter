var bs = require("./scripts/browser_salt");
var ss = require("./modules/server_salt");
var sha1 = require("./scripts/sha1");
var readline = require('readline');

var rl = readline.createInterface({
    input : process.stdin,
    output : process.stdout
});

rl.question("username?", function (username) {
    rl.question("password?", function (password) {
        console.log(sha1(ss(username, sha1(bs(username, password)))));
        process.exit(0);
    });
});
