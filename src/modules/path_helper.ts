import { normalize, join } from "path";

export class PathHelper {
    _base: string;

    constructor(base: string) {
        this._base = base;
    }

    getPath(p: string): string {
        if (p.length == 0) return this._base;
        if (p[0] == "/") return normalize(p);

        return join(this._base, p);
    }
}
