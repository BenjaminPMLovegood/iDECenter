module.exports = function(name, req, res, appendix) {
    const user = req.session.passport.user;
    res.render(name, Object.assign({ username : user.username, id : user.id, super : user.super }, appendix));
}
