import { ChildProcess } from "child_process";
import { Logger } from "log4js";
import { Readable, Writable } from "stream";

function JSONstringifyU(j: object) {
    var json = JSON.stringify(j);
    return json.replace(/[\u007F-\uFFFF]/g, function(chr) {
        return "\\u" + ("0000" + chr.charCodeAt(0).toString(16)).substr(-4);
    });
}

interface ResponsePackage {
    module: string,
    token: number,
    args: object
}

interface RequestPackage {
    module: string,
    command: string,
    args: object
}

function isValidResponsePackage(pkg: any): pkg is ResponsePackage {
    return "module" in pkg && "token" in pkg && "args" in pkg;
}

export default class StdioDaemon {
    _buffer: string;
    _child: ChildProcess;
    _logger: Logger;
    _callbacks: { [ id: number ]: (result: object) => void };
    _stdin: Writable;

    constructor (child: ChildProcess, logger: Logger) {
        this._buffer = "";
        this._child = child;
        this._logger = logger;
        this._callbacks = {};
        this._stdin = this._child.stdin;

        this._child.stdout.on('data', data => {
            this._buffer = this._buffer + data;
            // this._logger.warn(this._buffer);

            var pkgs = this._buffer.split("\n");
            this._buffer = pkgs[pkgs.length - 1];

            pkgs = pkgs.slice(0, -1);

            for (var pkgstr of pkgs) {
                var pkg = JSON.parse(pkgstr);
                if (isValidResponsePackage(pkg)) {
                    this._logger.info(`daemon received a package with module: ${pkg.module}, token: ${pkg.token}, content: ${JSON.stringify(pkg.args)}.`);
        
                    if (this._callbacks[pkg.token]) {
                        this._callbacks[pkg.token](pkg.args);
                        delete this._callbacks[pkg.token];
                    }
                }
            }
        });

        this._child.stderr.on('data', data => {
            this._logger.warn(`daemon send ${data} via stderr`);
        });
    }

    private send(module: string, command: string, args: object): number {
        var token = Math.round(Math.random() * 100000000);
        this._logger.info(`daemon sent a package with module: ${module}, command: ${command}, token: ${token}, content: ${JSON.stringify(args)}.`);
        this._stdin.write(JSONstringifyU({ module : module, command : command, token : token, args : args }) + "\n");
        return token;
    }

    public call(module: string, command: string, args: object, callback: (result: object) => void) {
        this._callbacks[this.send(module, command, args)] = callback;
    }

    public async acall(module: string, command: string, args: object): Promise<object> {
        return new Promise<object>(resolve => this.call(module, command, args, resolve));
    }

    public async acallt<T>(module: string, command: string, args: object): Promise<T> {
        return new Promise<T>(resolve => this.call(module, command, args, value => resolve(value as any as T)));
    }

    public close() {
        this.send("$any", "$terminator", {});
    }
}
