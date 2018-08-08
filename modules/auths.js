module.exports.isAuthenticated = function(req, res, next) {
    if (!req.isAuthenticated()) {
        req.flash("error", "You're not logged in.");
        res.redirect("/login");
    } else {
        return next();
    }
}

module.exports.isAuthenticatedForApi = function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.status(403).json({ error : "Not logged in." });
    } else {
        return next();
    }
}

module.exports.isAuthenticatedSuper = function(users) {
    return function (req, res, next) {
        if (!req.isAuthenticated()) {
            req.flash("error", "You're not logged in.");
            res.redirect("/login");
        } else {
            users.isSuper(req.session.passport.user.username).then(s => {
                if (!s) {
                    res.status(403).send("Permission denied."); // change it to a 403 page
                } else {
                    return next();
                }
            });
        }
    }
}

module.exports.isAuthenticatedSuperForApi = function(users) {
    return function (req, res, next) {
        if (!req.isAuthenticated()) {
            res.status(403).json({ error : "Not logged in." });
        } else {
            users.isSuper(req.session.passport.user.username).then(s => {
                if (!s) {
                    res.status(403).json({ error : "Permission denied." });
                } else {
                    return next();
                }
            });
        }
    }
}
