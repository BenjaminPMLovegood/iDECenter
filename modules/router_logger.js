// not used now, keep it here for a while

// logger4js can be a logger or a function Request -> Logger
// level can be a string or a function Request -> string
// any of functions above returns undefined, ignore
module.exports = function(logger4js, reqSerializer, level) {
    if (typeof logger4js != "function") {
        var logger4jsVar = logger4js;
        logger4js = (anything) => logger4jsVar;
    }

    reqSerializer = reqSerializer || (req => `${req.originalUrl} requested by ${req.ip}`);

    level = level || "info";
    
    if (typeof level == "string") {
        var levelString = level.toLowerCase();
        level = (anything) => levelString;
    }

    return function(req, res, next) {
        var loggerIns = logger4js(req);
        var levelString = level(req);

        if (loggerIns && levelString) loggerIns[levelString](reqSerializer(req));
        next();
    }
}
