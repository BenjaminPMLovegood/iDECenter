const render = require("../modules/render");

const express = require("express");
module.exports = function(env) {
    var router = express.Router();
    var passport = env.passport;

    router.get("/", function(req, res) {
        if (req.isAuthenticated()) return res.redirect("/pages/dashboard");
        render("index", req, res);
    });

    router.get("/login", function(req, res) {
        res.locals.err = req.flash('error');
        render("login", req, res, { title : "Login" });
    });
    
    router.post("/login_gate", passport.authenticate("login", {
        successRedirect: "/",
        failureRedirect: "/login",
        failureFlash: true
    }));

    router.post("/logout", function(req, res) {
        req.logout();
        res.redirect("/");
    }).get("/logout", function(req, res) {
        req.logout();
        res.redirect("/");
    });

    return router;
}
