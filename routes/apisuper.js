const util = require("util");

function ranDigit() {
    return Math.floor(Math.random() * 10);
}

const express = require("express");
module.exports = function(env) {
    var router = express.Router();
    var users = env.users;

    router.post("/add_user", function(req, res) {
        var username = req.body.username;
        var password = req.body.password;
        var isSuper = req.body.super || false;
        var c9password = "" + ranDigit() + ranDigit() + ranDigit() + ranDigit() + ranDigit() + ranDigit();

        if (username == undefined || password == undefined) return res.json({ succeeded : false, error : "Invalid parameters." });

        users.addUser(username, password, isSuper, c9password).then(v => res.json(v));
    });

    router.all("/shutdown", function(req, res) {
        process.exit(0);
    })

    return router;
}
