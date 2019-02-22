import { Database } from "sqlite3";
import { Logger } from "log4js";

function pack<TResult>(fn: (sql: string, ...params: any[]) => any, env: Database, logger: Logger): (sql: string, ...params: any[]) => Promise<TResult> {
    return async function(sql: string, ...params: any[]): Promise<TResult> {
        return new Promise<TResult>((resolve, reject) => {
            // console.log(fn, env, sql, args);
            fn.call(env, sql, ...params, (err: any, result: TResult) => {
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
    all: (sql: string, ...params: any[]) => Promise<any[]>;
    get: (sql: string, ...params: any[]) => Promise<any>;
    run: (sql: string, ...params: any[]) => Promise<void>;
}

export default function sqlitePromise(database: Database, logger: Logger): DatabasePromised {
    return {
        all : pack<any[]>(database.all, database, logger),
        get : pack<any>(database.get, database, logger),
        run : pack<void>(database.run, database, logger)
    }
}
