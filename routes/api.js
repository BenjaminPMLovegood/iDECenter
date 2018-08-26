const express = require("express");
const nameCheck = require("../scripts/check_username");

module.exports = function(env) {
    var router = express.Router();
    var users = env.users, projects = env.projects, templates = env.templates, wm = env.workspaceManager;

    router.post("/create_project", function(req, res) {
        var uid = req.session.passport.user.id;
        var template = req.body.template || "$a invalid template name$";
        var projectName = req.body.project || "$a invalid project name$";

        if (!nameCheck.checkProjectName(project)) return res.json({ succeeded : false, error : "Invalid project name." });
        if (!templates.templateExists(template)) return res.json({ succeeded : false, error : "Template does not exists." });
        if (projects.projExists(uid, project)) return res.json({ succeeded : false, error : "Project already exists." });

        var userInfo = users.getUserInfo(uid);

        wm.ensureUserDir(userInfo.name, userInfo.c9password);
        var projDir = wm.ensureProjectDir(userInfo.name, projectName);

        var fmap = templates.instantiateProjectSync(template, projDir);
        
        var maxid = projects.getMaxPid();
        var port = projects.baseport + maxid + 1;

        
    });

    router.post("/launch_project", async function(req, res) {

    });

    router.post("/stop_project", async function(req, res) {

    });

    router.post("/delete_project", function(req, res) {

    });

    router.post("/get_templates", function(req, res) {
        res.json(templates.names());
    });

    router.post("/get_projects", async function(req, res) {
        res.json(await projects.queryUsersProjects(req.session.passport.user.id));
    });

    // do nothing, just refresh cookie
    router.all("/do_nothing", function(req, res) {
        res.json({ kasugano : "sora" });
    });

    return router;
}
