import { Router, Request } from "express";
import { checkProjectName } from "../modules/check_username";
import { PathHelper } from "../modules/path_helper";
import { RoutesEnv } from "../modules/routes_env";
import { checkSessionUser } from "../modules/routes_utils";

const ph = new PathHelper("/workspace/");

export default function(env: RoutesEnv) {
    var router = Router();
    var templates = env.templates, wm = env.workspaceManager;
    var config = env.config;
    var docker = env.docker;
    var dba = env.dba;

    // todo: simplify this
    router.post("/create_project", async function(req, res) {
        var user = checkSessionUser(req);
        if (user == undefined) return;

        var uid = user.id;
        var template = req.body.template || "$a invalid template name$";
        var projectName = req.body.project || "$a invalid project name$";

        if (!checkProjectName(projectName)) return res.json({ succeeded : false, error : "Invalid project name." });
        if (!templates.templateExists(template)) return res.json({ succeeded : false, error : "Template does not exists." });

        if (await dba.projectExists(uid, projectName)) return res.json({ succeeded : false, error : "Project already exists." });

        var userInfo = await dba.getUserById(uid);
        var authDir = await wm.ensureAuthDir(userInfo.username, userInfo.c9password);
        var projDir = await wm.ensureProjectDir(userInfo.username, projectName);
        var fmaps = await templates.instantiateProject(template, projDir);
        fmaps = fmaps.map(m => { return { host : m.host, docker : ph.getPath(m.docker), readonly : m.readonly }});
        fmaps.push({ host : authDir, docker : "/root/c9auth", readonly : true });

        var port = config.get("projects.c9baseport") - 0 + await dba.getMaxPid() + 1;
    
        var cid = await docker.create("idec/idec:latest", [{ docker : 8080, host : port }], fmaps, [ "--ulimit nproc=1024:1024" ])
        if (!cid) {
            return res.json({ succeeded : false, error : "Failed to create docker container." });
        }

        try {
            await dba.createProjectInDB(uid, projectName, port, cid);
            return res.json({ succeeded : true });
        } catch (error) {
            return res.json({ succeeded : false, error : "Failed to write db." + " " + error });
        }
    });

    // todo: make super user really super
    router.post("/launch_project", async function(req, res) {
        var user = checkSessionUser(req);
        if (user == undefined) return;

        var uid = user.id;
        var pid = req.body.pid;
        
        var info = await dba.getProjectByPid(pid);

        if (!info) return res.json({ succeeded : false, error : "Project does not exists." });
        if (info.owner != uid && !user.super) return res.json({ succeeded : false, error : "You are not permitted to do this." });
        if (info.running) return res.json({ succeeded : false, error : "Already running." });

        try {
            await docker.start(info.containerId);
            await docker.refreshRunningStatus();
            return res.json({ succeeded : true });
        } catch (error) {
            return res.json({ succeeded : false, error : error });
        }
    });

    router.post("/stop_project", async function(req, res) {
        var user = checkSessionUser(req);
        if (user == undefined) return;

        var uid = user.id;
        var pid = req.body.pid;
        
        var info = await dba.getProjectByPid(pid);

        if (!info) return res.json({ succeeded : false, error : "Project does not exists." });
        if (info.owner != uid && !user.super) return res.json({ succeeded : false, error : "You are not permitted to do this." });
        if (!info.running) return res.json({ succeeded : false, error : "Already stopped." });

        try {
            await docker.kill(info.containerId);
            await docker.refreshRunningStatus();
            return res.json({ succeeded : true });
        } catch (error) {
            return res.json({ succeeded : false, error : error });
        }
    });

    router.post("/delete_project", async function(req, res) {
        var user = checkSessionUser(req);
        if (user == undefined) return;

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
            try {
                await wm.archiveProjectDir(ownername, projectName, pid);
                await dba.deleteProjectInDB(pid);
                return res.json({ succeeded : true });
            } catch (error) {
                return res.json({ succeeded : false, error : error });
            }
        } else {
            try {
                await wm.deleteProjectDir(ownername, projectName);
                await dba.deleteProjectInDB(pid);
                return res.json({ succeeded : true });
            } catch (error) {
                return res.json({ succeeded : false, error : error });
            }
        }
    });

    router.post("/get_templates", function(req, res) {
        res.json(templates.names());
    });

    router.post("/get_projects", async function(req, res) {
        var user = checkSessionUser(req);
        if (user == undefined) return;
        res.json(await dba.getUserProjects(user.id));
    });

    // do nothing, just refresh cookie
    router.all("/do_nothing", function(req, res) {
        res.json({ kasugano : "sora" });
    });

    return router;
}
