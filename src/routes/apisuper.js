const util = require("util");
const fs = require("fs");
const express = require("express");
const multer = require("multer");

module.exports = function(env) {
    var router = express.Router();
    var docker = env.docker;
    var daemon = env.daemon;
    var dba = env.dba;
    var templates = env.templates; 
    var m = multer({ dest : env.config.get("website.templateDir") });

    // user management
    router.post("/add_user", function(req, res) {
        var username = req.body.username;
        var password = req.body.password;
        var isSuper = req.body.super || false;
        var c9password = util.format("%d", Math.floor(Math.random() * 1000000 + 1000000)).substring(1);

        if (username == undefined || password == undefined) return res.json({ succeeded : false, error : "Invalid parameters." });

        dba.addUser(username, password, isSuper, c9password).then(v => res.json(v));
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
        res.json(await dba.getAllUsers());
    });

    router.post("/add_template", m.fields([{ name : "config", maxCount : 1 }, { name : "archive", maxCount : 1 }]), async function(req, res) {
        fs.readFile(req.files["config"][0].path, (err, data) => {
            if (err) res.json({ succeeded : false, error : err });

            var config = JSON.parse(data.toString());
            var name = config.name;
            
            daemon.acall("projmgr", "extracttar", { path : req.files["archive"][0].path, target : "./template/" + name }).then(result => {
                console.log(result);
                if (result.succeeded) {
                    console.log("success!");
                    templates.add(config);
                }
                res.redirect("/pagesuper/index");
            });
        })
    });

    // shutdown
    router.all("/shutdown", function(req, res) {
        process.exit(0);
    });

    return router;
}
