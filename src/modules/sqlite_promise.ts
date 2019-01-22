import { Database } from "sqlite3";
import { Logger } from "log4js";

function pack(fn: (sql: string, ...params: any[]) => any, env: any, logger: Logger): (sql: string, ...params: any[]) => Promise<any> {
    return async function(sql: string, ...params: any[]): Promise<any> {
        return new Promise<any>((resolve: any, reject: any) => {
            // console.log(fn, env, sql, args);
            fn.call(env, sql, ...params, (err: any, result: any) => {
                if (err) {
                    logger.warn(`SQL failed. SQL: ${sql}, args: ${JSON.stringify(params)}, err: ${JSON.stringify(err)}`);
                    reject(err);
                } else {
                    logger.info(`SQL done. SQL: ${sql}, args: ${JSON.stringify(params)}, result: ${JSON.stringify(result)}`);
                    resolve(result);
                }
            });
        });
    }
}

export interface DatabasePromised {
    all: (sql: string, ...params: any[]) => Promise<any>;
    get: (sql: string, ...params: any[]) => Promise<any>;
    run: (sql: string, ...params: any[]) => Promise<any>;
}

export default function sqlitePromise(database: Database, logger: Logger): DatabasePromised {
    return {
        all : pack(database.all, database, logger),
        get : pack(database.get, database, logger),
        run : pack(database.run, database, logger)
    }
}
