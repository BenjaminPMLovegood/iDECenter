var net = require("net");
var event = require("events");

JSON.stringifyU = function(j) {
    var json = JSON.stringify(j);
    return json.replace(/[\u007F-\uFFFF]/g, function(chr) {
        return "\\u" + ("0000" + chr.charCodeAt(0).toString(16)).substr(-4);
    });
}

class StdioDaemon {
    constructor (child, env) {
        this._buffer = "";
        this._child = child;
        this._logger = env.loggers.daemon;
        this._loggerdefault = env.loggers.default;
        this._callbacks = {};
        this._stdin = this._child.stdin;

        this._child.stdout.on('data', data => {
            this._buffer = this._buffer + data;
            // this._logger.warn(this._buffer);

            var pkgs = this._buffer.split("\n");
            this._buffer = pkgs[pkgs.length - 1];

            pkgs = pkgs.slice(0, -1).map(pkg => JSON.parse(pkg)).filter(i => i["module"] && i["token"] && i["args"]);

            for (var _i in pkgs) {
                var i = pkgs[_i];
                this._logger.info(`daemon received a package with module: ${i["module"]}, token: ${i["token"]}, content: ${JSON.stringify(i["args"])}.`);
    
                if (this._callbacks[i["token"]]) {
                    this._callbacks[i["token"]](i["args"]);
                    delete this._callbacks[i["token"]];
                }
            }
        });

        this._child.stderr.on('data', data => {
            this._logger.warn(`daemon send ${data} via stderr`);
        });
    }

    send(module, command, args) {
        var token = Math.round(Math.random() * 100000000);
        this._logger.info(`daemon sent a package with module: ${module}, command: ${command}, token: ${token}, content: ${JSON.stringify(args)}.`);
        this._stdin.write(JSON.stringifyU({ module : module, command : command, token : token, args : args }) + "\n");
        return token;
    }

    call(module, command, args, callback) {
        this._callbacks[this.send(module, command, args)] = callback;
    }

    async acall(module, command, args) {
        return new Promise(resolve => this.call(module, command, args, resolve));
    }

    close() {
        this.send("$any", "$terminator", {});
    }
}

module.exports = StdioDaemon;
