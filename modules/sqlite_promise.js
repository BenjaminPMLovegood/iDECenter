function pack(fn, env, logger) {
    return async function(sql) {
        var args = Array.prototype.slice.call(arguments, 1);
        return new Promise((resolve, reject) => {
            // console.log(fn, env, sql, args);
            fn.call(env, sql, ...args, (err, result) => {
                if (err) {
                    logger.warn(`SQL failed. SQL: ${sql}, args: ${JSON.stringify(args)}, err: ${JSON.stringify(err)}`);
                    reject(err);
                } else {
                    logger.info(`SQL done. SQL: ${sql}, args: ${JSON.stringify(args)}, result: ${JSON.stringify(result)}`);
                    resolve(result);
                }
            });
        });
    }
}

module.exports = function(Database, logger) {
    return {
        all : pack(Database.all, Database, logger),
        get : pack(Database.get, Database, logger),
        run : pack(Database.run, Database, logger)
    }
}
