import { render } from "../modules/render";
import { Router } from "express";
import { RoutesEnv } from "../modules/routes_env";

export default function(env: RoutesEnv) {
    var router = Router();
    var config = env.config;

    router.get("/index", function(req, res) {
        render("pagesuper/index", req, res, { title : "Control panel", allowregister : config.get("website.allowregister") });
    });

    router.get("/enable_register", function(req, res) {
        config.set("website.allowregister", true);
        res.redirect("/pagesuper/index");
    });

    router.get("/disable_register", function(req, res) {
        config.set("website.allowregister", false);
        res.redirect("/pagesuper/index");
    });

    router.get("/projects", function(req, res) {
        render("pagesuper/projects", req, res, { title : "Manage project" });
    });

    router.get("/users", function(req, res) {
        render("pagesuper/users", req, res, { title : "Manage users" });
    });

    router.get("/add_template", function(req, res) {
        render("pagesuper/add_template", req, res, { title : "Add template" });
    });

    return router;
}
