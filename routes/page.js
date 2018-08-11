const render = require("../modules/render");

const express = require("express");
module.exports = function(env) {
    var router = express.Router();
    
    router.get("/dashboard", function(req, res) {
    
    });
    
    router.get("/c9/:pid", function(req, res) {
        var username = req.session.passport.user.username;
        var pid = req.params.pid;

        
    });
    
    router.get("/templates", function(req, res) {
        render("pages/templates", req, res);
    });

    return router;
}
