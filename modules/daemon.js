var net = require("net");
var event = require("events");

JSON.stringifyU = function(j) {
    var json = JSON.stringify(j);
    return json.replace(/[\u007F-\uFFFF]/g, function(chr) {
        return "\\u" + ("0000" + chr.charCodeAt(0).toString(16)).substr(-4);
    });
}

class Daemon /* extends event.EventEmitter */ {
    constructor (port, env) {
        /* super(); */

        this._port = port;
        this._connected = false;
        this._buffer = "";
        this._sock = undefined;
        this._logger = env.loggers.daemon;
        this._callbacks = {};

        this._server = net.createServer(sock => {
            this._connected = true;
            this._sock = sock;
            this._server.close();

            sock.setEncoding("utf-8");

            this._logger.info(`client ${sock.remoteAddress}:${sock.remotePort} connected`);

            sock.on("data", data => {
                this._buffer += data;
                var pkgs = this._buffer.split("|");
                this._buffer = pkgs[pkgs.length - 1];

                pkgs = pkgs.slice(0, -1).map(pkg => JSON.parse(pkg)).filter(i => i["module"] && i["token"] && i["args"]);

                for (var _i in pkgs) {
                    var i = pkgs[_i];
                    this._logger.info(`daemon received a package with module: ${i["module"]}, token: ${i["token"]}, content: ${JSON.stringify(i["args"])}.`);
                    /*
                    this.emit("result", i["module"], i["token"], i["args"]);
                    */
                    if (this._callbacks[i["token"]]) {
                        this._callbacks[i["token"]](i["args"]);
                        delete this._callbacks[i["token"]];
                    }
                }
            });

            sock.on("close", had_error => {
                this._connected = false;
            });
        });
    }

    listen(callback) {
        this._server.listen(this._port, () => {
            this._logger.info("daemon listening...");
            callback();
        });
    }

    send(module, command, args) {
        if (!this._connected) return undefined;

        var token = Math.round(Math.random() * 100000000);
        this._logger.info(`daemon sent a package with module: ${module}, command: ${command}, token: ${token}, content: ${JSON.stringify(args)}.`);
        this._sock.write(JSON.stringifyU({ module : module, command : command, token : token, args : args }) + "|");
        return token;
    }

    call(module, command, args, callback) {
        this._callbacks[this.send(module, command, args)] = callback;
    }

    async acall(module, command, args) {
        return new Promise(resolve => this.call(module, command, args, resolve));
    }

    close() {
        if (!this._connected) return;

        this.send("$any", "$terminator", {});
    }
}

module.exports = Daemon;
