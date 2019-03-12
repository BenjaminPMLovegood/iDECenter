import { format } from "util";
import { readFile } from "fs";
import { Router } from "express";
import { RoutesEnv } from "../modules/routes_env";
import * as multer from "multer";

export default function(env: RoutesEnv) {
    var router = Router();
    var docker = env.docker;
    var daemon = env.daemon;
    var dba = env.dba;
    var templates = env.templates; 
    var m = multer({ dest : env.config.get("website.templateDir") });

    // user management
    router.post("/add_user", function(req, res) {
        var username = req.body.username;
        var password = req.body.password;
        var isSuper = req.body.super || false;
        var c9password = format("%d", Math.floor(Math.random() * 1000000 + 1000000)).substring(1);

        if (username == undefined || password == undefined) return res.json({ succeeded : false, error : "Invalid parameters." });

        dba.addUser(username, password, isSuper, c9password).then(v => res.json(v));
    });

    // projects management
    router.post("/get_all_projects", async function(req, res) {
        res.json(await dba.getAllProjects());
    });

    router.post("/stop_all_projects", async function(req, res) {
        try {
            var projs = (await dba.getAllProjects()).filter(p => p.running);

            await docker.killmany(projs.map(p => p.containerId));
            await docker.refreshRunningStatus();

            res.json({ succeeded : true });
        } catch (error) {
            res.json({ succeeded : false });
        }
    });

    router.post("/get_all_users", async function(req, res) {
        res.json(await dba.getAllUsers());
    });

    router.post("/add_template", m.fields([{ name : "config", maxCount : 1 }, { name : "archive", maxCount : 1 }]), async function(req, res) {
        if (Array.isArray(req.files)) res.redirect("/pagesuper/index");

        var files = req.files as { [fieldname: string]: Express.Multer.File[]; } ;
        var configFile = files["config"][0].path;
        var archiveFile = files["archive"][0].path;
        readFile(configFile, (err, data) => {
            if (err) res.json({ succeeded : false, error : err });

            var config = JSON.parse(data.toString());
            var name = config.name;
            
            daemon.acallt<{ succeeded : boolean }>("projmgr", "extracttar", { path : archiveFile, target : "./template/" + name }).then(result => {
                if (result.succeeded) {
                    console.log("success!");
                    templates.add(config);
                }
                res.redirect("/pagesuper/index");
            });
        })
    });

    // shutdown
    router.all("/shutdown", function(req, res) {
        process.exit(0);
    });

    return router;
}
