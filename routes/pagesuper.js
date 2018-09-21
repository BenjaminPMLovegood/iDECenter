const render = require("../modules/render");

const express = require("express");
module.exports = function(env) {
    var router = express.Router();
    var projects = env.projects;
    var config = env.config;

    router.get("/index", function(req, res) {
        render("pagesuper/index", req, res, { title : "Control panel", allowregister : config.allowregister });
    });

    router.get("/enable_register", function(req, res) {
        config.allowregister = true;
        res.redirect("/pagesuper/index");
    });

    router.get("/disable_register", function(req, res) {
        config.allowregister = false;
        res.redirect("/pagesuper/index");
    });

    router.get("/projects", function(req, res) {
        render("pagesuper/projects", req, res, { title : "Manage project" });
    });

    router.get("/users", function(req, res) {
        render("pagesuper/users", req, res, { title : "Manage users" });
    });

    return router;
}
