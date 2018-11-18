const express = require("express");
const nameCheck = require("../scripts/check_username");
const pathHelper = require("../modules/path_helper");

const ph = new pathHelper("/workspace/");

module.exports = function(env) {
    var router = express.Router();
    var templates = env.templates, wm = env.workspaceManager;
    var config = env.config;
    var docker = env.docker;
    var dba = env.dba;

    // todo: simplify this
    router.post("/create_project", async function(req, res) {
        var uid = req.session.passport.user.id;
        var template = req.body.template || "$a invalid template name$";
        var projectName = req.body.project || "$a invalid project name$";

        if (!nameCheck.checkProjectName(projectName)) return res.json({ succeeded : false, error : "Invalid project name." });
        if (!templates.templateExists(template)) return res.json({ succeeded : false, error : "Template does not exists." });

        if (await dba.projectExists(uid, projectName)) return res.json({ succeeded : false, error : "Project already exists." });

        var userInfo = await dba.getUserById(uid);
        var authDir = await wm.ensureAuthDir(userInfo.username, userInfo.c9password);
        var projDir = await wm.ensureProjectDir(userInfo.username, projectName);
        var fmaps = await templates.instantiateProject(template, projDir);
        fmaps = fmaps.map(m => { return { host : m.host, docker : ph.getPath(m.docker), readonly : m.readonly }});
        fmaps.push({ host : authDir, docker : "/root/c9auth", readonly : true });

        var port = config.c9portbase - 0 + await dba.getMaxPid() + 1;
    
        var cid = await docker.create("idec/idec:latest", [{ docker : 8080, host : port }], fmaps, [ "--ulimit nproc=1024:1024" ])
        if (!cid) {
            return res.json({ succeeded : false, error : "Failed to create docker container." });
        }

        dba.createProjectInDB(uid, projectName, port, cid).then(result => {
            return res.json({ succeeded : true });
        }).catch(anything => {
            return res.json({ succeeded : false, error : "Failed to write db." });
        });
    });

    // todo: make super user really super
    router.post("/launch_project", async function(req, res) {
        var user = req.session.passport.user;
        var uid = user.id;
        var pid = req.body.pid;
        
        var info = await dba.getProjectByPid(pid);

        if (!info) return res.json({ succeeded : false, error : "Project does not exists." });
        if (info.owner != uid && !user.super) return res.json({ succeeded : false, error : "You are not permitted to do this." });
        if (info.running) return res.json({ succeeded : false, error : "Already running." });

        docker.start(info.containerId).then(result => {
            if (!result) return res.json({ succeeded : false, error : result.error });

            docker.refreshRunningStatus().then(anything => res.json({ succeeded : true }));
        });
    });

    router.post("/stop_project", async function(req, res) {
        var user = req.session.passport.user;
        var uid = user.id;
        var pid = req.body.pid;
        
        dba.getProjectByPid(pid).then(info => {
            if (!info) return res.json({ succeeded : false, error : "Project does not exists." });
            if (info.owner != uid && !user.super) return res.json({ succeeded : false, error : "You are not permitted to do this." });
            if (!info.running) return res.json({ succeeded : false, error : "Already stopped." });

            docker.kill(info.containerId).then(result => {
                if (!result) return res.json({ succeeded : false, error : result.error });

                docker.refreshRunningStatus().then(anything => res.json({ succeeded : true }));
            })
        });
    });

    router.post("/delete_project", async function(req, res) {
        var user = req.session.passport.user;
        var uid = user.id;
        var pid = req.body.pid || -1;
        var archive = req.body.archive || "false";
        archive = archive == "true";

        var info = await dba.getProjectByPid(pid);
        var projectName = info.name;

        if (!info) return res.json({ succeeded : false, error : "Project doesn't exist." });
        if (info.owner != uid && !user.super) return res.json({ succeeded : false, error : "You are not permitted to do this." });

        var ownername = (await dba.getUserById(info.owner)).username;

        if (archive) {
            wm.archiveProjectDir(ownername, projectName, pid).then(anything => {
                dba.deleteProjectInDB(pid).then(anything => {
                    res.json({ succeeded : true });
                });
            });
        } else {
            wm.deleteProjectDir(ownername, projectName).then(anything => {
                dba.deleteProjectInDB(pid).then(anything => {
                    res.json({ succeeded : true });
                });
            });
        }
    });

    router.post("/get_templates", function(req, res) {
        res.json(templates.names());
    });

    router.post("/get_projects", async function(req, res) {
        res.json(await dba.getUserProjects(req.session.passport.user.id));
    });

    // do nothing, just refresh cookie
    router.all("/do_nothing", function(req, res) {
        res.json({ kasugano : "sora" });
    });

    return router;
}
