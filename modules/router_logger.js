module.exports = function(logger4js, reqSerializer, level) {
    reqSerializer = reqSerializer || (req => `${req.originalUrl} requested by ${req.ip}`);
    level = (level || "info").toLowerCase();
    return function(req, res, next) {
        logger4js[level](reqSerializer(req));
        next();
    }
}
