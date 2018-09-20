const 
    fs = require("fs"),
    path = require("path");

class TemplateCollection {
    constructor(templates, env) {
        this._templates = {};
        this._pathHelper = env.ph;
        this._daemon = env.daemon;

        for (var i in templates) {
            var v = templates[i];
            this._templates[v.name] = this._processNode(v.root);
        }

        this._namesCache = templates.map(temp => temp.name);
    }

    _processNode(node) {
        node.path = this._pathHelper.getPath(node.path);

        if (node.sub) {
            for (var i in node.sub) {
                this._processNode(node.sub[i]);
            }
        }

        return node;
    }

    names() {
        return this._namesCache;
    }

    templateExists(templateName) {
        return templateName in this._templates;
    }

    /* keep it here in case daemon doesn't work well
    // target path must be absolute
    instantiateProjectNode(conf, targetPath, relPath) {
        var rv = [];
        var shared = conf.shared || false;
        var fpath = this._pathHelper.getPath(conf.path);
        var readonly = conf.readonly || false;
        var sub = conf.sub || {};

        if (shared) {
            rv.push({ docker : relPath, host : fpath, readonly : readonly });
            
            for (var key in sub) {
                var nextPath = path.join(targetPath, key);
                var node = sub[key];

                if (!fs.existsSync(nextPath)) fs.mkdirSync(nextPath);
                rv.push(...this.instantiateProjectNode(node, nextPath, path.join(targetPath, key)));
            }
        } else {
            if (relPath == ".") rv.push({ docker : relPath, host : this._pathHelper.getPath(targetPath), readonly : readonly });

            var ss = fs.readdirSync(fpath);
            for (var _s in ss) {
                var s = ss[_s];
                var nextPath = path.join(targetPath, s);

                if (s in sub) {
                    if (!fs.existsSync(nextPath)) fs.mkdirSync(nextPath);
                    rv.push(...this.instantiateProjectNode(sub[s], nextPath, path.join(relPath, s)));
                } else {
                    var subpath = path.join(fpath, s);
                    var stat = fs.statSync(subpath);
                    if (stat.isFile()) {
                        fs.copyFileSync(subpath, nextPath);
                    } else if (stat.isDirectory()) {
                        copyDir(subpath, nextPath);
                    }
                }
            }
        }

        return rv;
    }

    instantiateProjectSync(templateName, projectDir) {
        if (!this.templateExists(templateName)) return false;

        var root = this._templates[templateName];
        var projectDirAbs = this._pathHelper.getPath(projectDir);
        if (!fs.existsSync(projectDirAbs)) fs.mkdirSync(projectDirAbs);
        return this.instantiateProjectNode(root, projectDirAbs, ".");
    }
    */

    async instantiateProject(templateName, projectDir) {
        return new Promise((resolve, reject) => {
            if (!this.templateExists(templateName)) reject("project not exists");

            var root = this._templates[templateName];
            var projectDirAbs = this._pathHelper.getPath(projectDir);

            this._daemon.acall("projmgr", "instantiate", { root : root, target : projectDirAbs }).then(v => {
                if (v.dirmap) {
                    resolve(v.dirmap);
                } else {
                    reject(v.error);
                }
            });
        });
    }
}

module.exports = TemplateCollection;
