const render = require("../modules/render");
const pageDefiner = require("../modules/page_definer");

const express = require("express");
module.exports = function(env) {
    var router = express.Router();
    var projects = env.projects;
    var definePage = pageDefiner(router, env.loggers.page);
    
    definePage("/dashboard", function(req, res) {
        render("pages/dashboard", req, res, { title : "Dashboard" });
    });
    
    definePage("/c9/:pid", function(req, res) {
        var uid = req.session.passport.user.id;
        var pid = req.params.pid;

        projects.queryProjectInfo(pid).then(info => {
            if (!info) return render("pages/c9wrapper_err", req, res, { err : "not_exists" });

            var cid = info.containerId;
            var oid = info.owner;

            if (oid != uid) return render("pages/c9wrapper_err", req, res, { err : "not_yours" });

            if (!projects.isCidRunning(cid)) {
                render("pages/c9wrapper_err", req, res, { err : "not_running" });
            } else {
                render("pages/c9wrapper", req, res, { port : info.port, title : info.name });
            }
        })

    });

    definePage("/create_project", function(req, res) {
        render("pages/create_project", req, res, { title : "Create new project" });
    })

    return router;
}
