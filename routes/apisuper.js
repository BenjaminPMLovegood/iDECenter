const util = require("util");

const express = require("express");
module.exports = function(env) {
    var router = express.Router();
    var users = env.users;
    var docker = env.docker;
    var dba = env.dba;

    // user management
    router.post("/add_user", function(req, res) {
        var username = req.body.username;
        var password = req.body.password;
        var isSuper = req.body.super || false;
        var c9password = util.format("%d", Math.floor(Math.random() * 1000000 + 1000000)).substring(1);

        if (username == undefined || password == undefined) return res.json({ succeeded : false, error : "Invalid parameters." });

        users.addUser(username, password, isSuper, c9password).then(v => res.json(v));
    });

    // projects management
    router.post("/get_all_projects", async function(req, res) {
        res.json(await dba.getAllProjects());
    });

    router.post("/stop_all_projects", function(req, res) {
        dba.getAllProjects().then(v => {
            projs = v.filter(p => p.running);

            return docker.killmany(projs.map(p => p.containerId));
        }).then(x => {
            return docker.refreshRunningStatus();
        }).then(x => {
            res.json({ succeeded : true });
        }).catch(any => {
            res.json({ succeeded : false });
        });
    });

    router.post("/get_all_users", async function(req, res) {
        res.json(await users.getAllUsers());
    });

    // shutdown
    router.all("/shutdown", function(req, res) {
        process.exit(0);
    })

    return router;
}
