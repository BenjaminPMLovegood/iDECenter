module.exports = function(router, logger) {
    return function(path, handler,  way) {
        if (handler.length == 3) {
            router[way || 'get'](path, function(req, res, next) {
                var userInfo = (req.session.passport || { user : undefined }).user || { username : "not logged in", id : -1 };
        
                logger.info("page %s requested by user %s(%d) from", req.originalUrl, userInfo.username, userInfo.id, req.ip);
                handler(req, res, next);
            });
        } else {
            router[way || 'get'](path, function(req, res) {
                var userInfo = (req.session.passport || { user : undefined }).user || { username : "not logged in", id : -1 };

                logger.info("page %s requested by user %s(%d) from", req.originalUrl, userInfo.username, userInfo.id, req.ip);
                handler(req, res);
            });
        }
    }
}
