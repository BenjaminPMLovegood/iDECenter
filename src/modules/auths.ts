import { Logger } from "log4js";
import { Data } from "./dba";

module.exports = function(env) {
    var dba = env.dba;
    var violate = env.loggers.violate;
    var violateSuper = env.loggers.violate_super;

    var isAuthenticated = function(req, res, next) {
        if (!req.isAuthenticated()) {
            violate.info("%s is requested unauthenticatedly by", req.originalUrl, req.ip);
            req.flash("error", "You're not logged in.");
            res.redirect("/login");
        } else {
            return next();
        }
    };
    
    var isAuthenticatedForApi = function(req, res, next) {
        if (!req.isAuthenticated()) {
            violate.info("api %s is requested unauthenticatedly by", req.originalUrl, req.ip);
            res.status(403).json({ error : "Not logged in." });
        } else {
            return next();
        }
    };
    
    var isAuthenticatedSuper = function (req, res, next) {
        isAuthenticated(req, res, function() {
            dba.getUserById(req.session.passport.user.id).then(user => {
                s = user.super;
                if (!s) {
                    violateSuper.warn("%s is requested by non-super user %s(%d) from", req.originalUrl, req.session.passport.user.username, req.session.passport.user.id, req.ip);
                    res.status(403).send("Permission denied."); // change it to a 403 page
                } else {
                    return next();
                }
            });
        });
    };
    
    var isAuthenticatedSuperForApi = function (req, res, next) {
        isAuthenticatedForApi(req, res, function() {
            dba.getUserById(req.session.passport.user.id).then(user => {
                s = user.super;
                if (!s) {
                    violateSuper.warn("%s is requested by non-super user %s(%d) from", req.originalUrl, req.session.passport.user.username, req.session.passport.user.id, req.ip);
                    res.status(403).json({ error : "Permission denied." });
                } else {
                    return next();
                }
            });
        });
    };

    return {
        isAuthenticated : isAuthenticated,
        isAuthenticatedForApi : isAuthenticatedForApi,
        isAuthenticatedSuper : isAuthenticatedSuper,
        isAuthenticatedSuperForApi : isAuthenticatedSuperForApi
    };
};
