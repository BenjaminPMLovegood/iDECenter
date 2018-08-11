const 
    fs = require("fs"),
    path = require("path");

class PathHelper {
    constructor(base) {
        this._base = base;
    }

    getPath(p) {
        if (typeof p !== "string") return undefined;

        if (p.length == 0) return this._base;
        if (p[0] == "/") return path.normalize(p);

        return path.join(this._base, p);
    }
}

module.exports = PathHelper;
