const render = require("../modules/render");

const express = require("express");
module.exports = function(env) {
    var router = express.Router();
    var projects = env.projects;
    
    router.get("/index", function(req, res) {
        render("pagesuper/index", req, res, { title : "Admin index" });
    });

    router.get("/projects", function(req, res) {
        render("pagesuper/projects", req, res, { title : "Manage project" });
    });

    router.get("/users", function(req, res) {
        render("pagesuper/users", req, res, { title : "Manage users" });
    });

    return router;
}
