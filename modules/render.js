module.exports = function(name, req, res, appendix) {
    if (req.isAuthenticated()) {
        const user = req.session.passport.user;
        res.render(name, Object.assign({ authed : true, username : user.username, uid : user.id, isSuper : user.super }, appendix));
    } else {
        res.render(name, Object.assign({ authed : false }, appendix));
    }
}
