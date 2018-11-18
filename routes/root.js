const render = require("../modules/render");
const checkUsername = require("../scripts/check_username");
const serverSalt = require("../modules/server_salt");

const express = require("express");
module.exports = function(env) {
    var router = express.Router();
    var passport = env.passport;
    var docker = env.docker;
    var config = env.config;

    router.get("/", function(req, res) {
        if (req.isAuthenticated()) return res.redirect("/pages/dashboard");
        render("index", req, res);
    });

    router.get("/register", function(req, res) {
        if (req.isAuthenticated()) return res.redirect("/");
        if (!config.allowregister) return render("register_disabled", req, res, { title : "Register" });
        render("register", req, res, { title : "Register" });
    });
    
    router.post("/register_gate", function(req, res) {
        if (req.isAuthenticated()) {
            req.flash("error", "logged in");
            res.redirect("/");
        }

        var username = req.body.username;
        var password = req.body.password;

        if (!username || !password || !checkUsername(username)) {
            req.flash("error", "invalid args");
            return res.redirect("/register");
        }

        dba.addUser(username, password, false, ("" + (1000000 + Math.round(Math.random() * 1000000))).substring(1)).then(v => {
            if (v.succeeded) {
                res.redirect("/register_success");
            } else {
                req.flash("error", v.error);
                res.redirect("/register");
            }
        }); 
    });

    router.get("/register_success", function(req, res) {
        if (req.isAuthenticated()) return res.redirect("/");
        render("register_success", req, res, { title : "Register done" });
    });

    router.get("/login", function(req, res) {
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
