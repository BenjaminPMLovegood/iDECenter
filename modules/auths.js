module.exports = function(env) {
    var users = env.users;

    return {
        isAuthenticated : function(req, res, next) {
            if (!req.isAuthenticated()) {
                req.flash("error", "You're not logged in.");
                res.redirect("/login");
            } else {
                return next();
            }
        },
        
        isAuthenticatedForApi : function(req, res, next) {
            if (!req.isAuthenticated()) {
                res.status(403).json({ error : "Not logged in." });
            } else {
                return next();
            }
        },
        
        isAuthenticatedSuper : function (req, res, next) {
            if (!req.isAuthenticated()) {
                req.flash("error", "You're not logged in.");
                res.redirect("/login");
            } else {
                users.isSuper(req.session.passport.user.id).then(s => {
                    if (!s) {
                        res.status(403).send("Permission denied."); // change it to a 403 page
                    } else {
                        return next();
                    }
                });
            }
        },
        
        isAuthenticatedSuperForApi : function (req, res, next) {
            if (!req.isAuthenticated()) {
                res.status(403).json({ error : "Not logged in." });
            } else {
                users.isSuper(req.session.passport.user.id).then(s => {
                    if (!s) {
                        res.status(403).json({ error : "Permission denied." });
                    } else {
                        return next();
                    }
                });
            }
        }
    }
};
