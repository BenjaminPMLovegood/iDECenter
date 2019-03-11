import { render } from "../modules/render";
import { checkUsername } from "../modules/check_username";

import { Router } from "express";
import { RoutesEnv } from "../modules/routes_env";

export default function(env: RoutesEnv) {
    var router = Router();
    var passport = env.passport;
    var config = env.config;
    var dba = env.dba;

    router.get("/", function(req, res) {
        if (req.isAuthenticated()) return res.redirect("/pages/dashboard");
        render("index", req, res);
    });

    router.get("/register", function(req, res) {
        if (req.isAuthenticated()) return res.redirect("/");
        if (!config.get("website.allowregister")) return render("register_disabled", req, res, { title : "Register" });
        render("register", req, res, { title : "Register" });
    });
    
    router.post("/register_gate", async function(req, res) {
        if (req.isAuthenticated()) {
            req.flash("error", "already logged in");
            res.redirect("/");
        }

        if (!config.get("website.allowregister")) {
            req.flash("error", "register disabled");
            res.redirect("/");
        }

        var username = req.body.username;
        var password = req.body.password;

        if (!username || !password || !checkUsername(username)) {
            req.flash("error", "invalid args");
            return res.redirect("/register");
        }

        try {
            await dba.addUser(username, password, false, ("" + (1000000 + Math.round(Math.random() * 1000000))).substring(1));
            res.redirect("/register_success");
        } catch (error) {
            req.flash("error", error);
            res.redirect("/register");
        }
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
