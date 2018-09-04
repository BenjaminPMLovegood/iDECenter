const render = require("../modules/render");

const express = require("express");
module.exports = function(env) {
    var router = express.Router();
    var projects = env.projects;
    
    router.get("/projects", function(req, res) {
        render("pagessuper/projects", req, res, { title : "Manage project" });
    })

    return router;
}
