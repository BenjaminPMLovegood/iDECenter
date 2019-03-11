import { Request } from "express";
import { User } from "./model";

export function checkSessionUser(req: Request): User | undefined {
    if (!req.isAuthenticated()) return undefined;
    if (req.session == undefined) return undefined;
    if (req.session.passport == undefined) return undefined;
    
    var user = req.session.passport.user;
    if (user == undefined) return undefined;
    return user;
}
