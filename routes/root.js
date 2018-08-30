const render = require("../modules/render");
const pageDefiner = require("../modules/page_definer");
const apiDefiner = require("../modules/api_definer");

const express = require("express");
module.exports = function(env) {
    var router = express.Router();
    var passport = env.passport;
    var definePage = pageDefiner(router, env.loggers.page);
    var defineApi = apiDefiner(router, env.loggers.api);
    var defineCriticalApi = apiDefiner(router, env.loggers.api_critical);

    definePage("/", function(req, res) {
        if (req.isAuthenticated()) return res.redirect("/pages/dashboard");
        render("index", req, res);
    });

    definePage("/login", function(req, res) {
        res.locals.err = req.flash('error');
        render("login", req, res, { title : "Login" });
    });
    
    defineCriticalApi("/login_gate", passport.authenticate("login", {
        successRedirect: "/",
        failureRedirect: "/login",
        failureFlash: true
    }));

    defineCriticalApi("/logout", function(req, res) {
        req.logout();
        res.redirect("/");
    }, "all");

    return router;
}
