const render = require("../modules/render");

const express = require("express");
module.exports = function(env) {
    var router = express.Router();
    var projects = env.projects;
    
    router.get("/dashboard", function(req, res) {
        render("pages/dashboard", req, res, { title : "Dashboard" });
    });
    
    router.get("/c9/:pid", function(req, res) {
        var uid = req.session.passport.user.id;
        var pid = req.params.pid;
        var cid = req.queryContainerId(pid);

        if (!projects.isRunning(cid)) {

        }
    });
    
    router.get("/templates", function(req, res) {
        render("pages/templates", req, res);
    });

    router.get("/projects", function(req, res) {
        render("pages/templates", req, res);
    });

    return router;
}
