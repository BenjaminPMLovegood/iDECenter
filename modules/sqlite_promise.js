function pack(fn, env) {
    return async function(sql) {
        var args = Array.prototype.slice.call(arguments, 1);
        return new Promise((resolve, reject) => {
            fn.call(env, sql, ...args, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    }
}

module.exports = function(Database) {
    return {
        all : pack(Database.all, Database),
        get : pack(Database.get, Database),
        run : pack(Database.run, Database)
    }
}
