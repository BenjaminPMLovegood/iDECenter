const express = require("express");
module.exports = function(env) {
    var router = express.Router();
    
    router.all("/:apiname", function(req, res, next) {
        console.log("api \"" + req.params.apiname + "\" called by " + req.session.passport.user.username);
        res.send("api \"" + req.params.apiname + "\" called by " + req.session.passport.user.username);
    });

    return router;
}
