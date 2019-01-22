import { Request, Response } from "express";

export default function(name: string, req: Request, res: Response, appendix: object) {
    if (req.isAuthenticated() && req.session) {
        const user = req.session.passport.user;
        res.render(name, Object.assign({ authed : true, username : user.username, uid : user.id, isSuper : user.super, c9password: user.c9password }, appendix));
    } else {
        res.render(name, Object.assign({ authed : false }, appendix));
    }
}
