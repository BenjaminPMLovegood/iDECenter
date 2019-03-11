import { format } from "util";
import { Request } from "express";

export function GetRequester(req: Request) {
    if (req.isAuthenticated() && req.session) {
        var userInfo = req.session.passport.user;
        return format("user %s(%d) from", userInfo.username, userInfo.id, req.ip);
    } else {
        return format("visitor from", req.ip);
    }
}
