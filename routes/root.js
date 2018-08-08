const express = require("express");
var router = express.Router();

router.get("/", function(req, res) {
    if (req.isAuthenticated()) res.redirect("/pages/dashboard");
    res.render("index");
});

router.get("/login", function(req, res) {
    res.locals.err = req.flash('error');
    res.render("login", { title : "Login" });
});

router.post("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
}).get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

module.exports = router;
