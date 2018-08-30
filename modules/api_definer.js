module.exports = function(router, logger) {
    return function(path, handler,  way) {
        if (handler.length == 3) {
            router[way || 'post'](path, function(req, res, next) {
                var userInfo = (req.session.passport || { user : undefined }).user || { username : "not logged in", id : -1 };

                logger.info("api %s called by user %s(%d) from", req.originalUrl, userInfo.username, userInfo.id, req.ip);
                handler(req, res, next);
            });
        } else {
            router[way || 'post'](path, function(req, res) {
                var userInfo = (req.session.passport || { user : undefined }).user || { username : "not logged in", id : -1 };

                logger.info("api %s called by user %s(%d) from", req.originalUrl, userInfo.username, userInfo.id, req.ip);
                handler(req, res);
            });
        }
    }
}
