const express = require("express");
var router = express.Router();

router.get("/dashboard", function(req, res) {

});

router.get("/c9", function(req, res) {
    var username = req.session.passport.user.username;

    var stmt = db.prepare("SELECT projects.name, projects.port FROM users, projects WHERE users.id = projects.owner AND user.username = ?");
    stmt.get(username, function(err, row) {
        if (typeof row !== "undefined") {
            res.render("c9wrapper_notrunning");
        } else {
            res.render("c9wrapper", { title : row.name + " - iDECenter", port : row.port })
        }
    });
    stmt.finalize();
});

router.get("/templates", function(req, res) {
    res.render("pages/templates");
});

module.exports = router;
