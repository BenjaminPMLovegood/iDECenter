import { Logger } from "log4js";
import DatabaseAssistant from "./dba";
import { User } from "./model"
import { Request, Response, NextFunction } from "express";

export default function(dba: DatabaseAssistant, violate: Logger, violateSuper: Logger) {
    var isAuthenticated = function(req: Request, res: Response, next: NextFunction) {
        if (!req.isAuthenticated()) {
            violate.info("%s is requested unauthenticatedly by", req.originalUrl, req.ip);
            req.flash("error", "You're not logged in.");
            res.redirect("/login");
        } else {
            return next();
        }
    };
    
    var isAuthenticatedForApi = function(req: Request, res: Response, next: NextFunction) {
        if (!req.isAuthenticated()) {
            violate.info("api %s is requested unauthenticatedly by", req.originalUrl, req.ip);
            res.status(403).json({ error : "Not logged in." });
        } else {
            return next();
        }
    };
    
    var isAuthenticatedSuper = function (req: Request, res: Response, next: NextFunction) {
        isAuthenticated(req, res, function() {
            var user: User = req.session ? req.session.passport.user : {};
            dba.getUserById(user.id).then(user => {
                if (!user.super) {
                    violateSuper.warn("%s is requested by non-super user %s(%d) from", req.originalUrl, user.username, user.id, req.ip);
                    res.status(403).send("Permission denied."); // change it to a 403 page
                } else {
                    return next();
                }
            });
        });
    };
    
    var isAuthenticatedSuperForApi = function (req: Request, res: Response, next: NextFunction) {
        isAuthenticatedForApi(req, res, function() {
            var user: User = req.session ? req.session.passport.user : {};
            dba.getUserById(user.id).then(user => {
                if (!user.super) {
                    violateSuper.warn("%s is requested by non-super user %s(%d) from", req.originalUrl, user.username, user.id, req.ip);
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
