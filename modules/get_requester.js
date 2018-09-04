const util = require("util");

module.exports = function(req) {
    if (req.isAuthenticated()) {
        var userInfo = req.session.passport.user;
        return util.format("user %s(%d) from", userInfo.username, userInfo.id, req.ip);
    } else {
        return util.format("visitor from", req.ip);
    }
}
