const 
    fs = require("fs"),
    path = require("path");

function copyDir(source, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);

    var subs = fs.readdirSync(source);

    for (var _s in subs) {
        var s = subs[_s];
        var subpath = path.join(source, s);
        var destpath = path.join(dest, s);

        var stat = fs.statSync(subpath);
        if (stat.isFile()) {
            fs.copyFileSync(subpath, destpath);
        } else if (stat.isDirectory()) {
            if (!fs.existsSync(destpath)) fs.mkdirSync(destpath); // if destpath exists as a File? fuck it

            copyDir(subpath, destpath);
        }
    }
}

class TemplateCollection {
    constructor(templates, pathHelper) {
        this._templates = {};
        this._pathHelper = pathHelper;

        for (var i in templates) {
            var v = templates[i];
            this._templates[v.name] = v.root;
        }

        this._namesCache = templates.map(temp => temp.name);
    }

    names() {
        return this._namesCache;
    }

    templateExists(templateName) {
        return templateName in this._templates;
    }

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
}

module.exports = TemplateCollection;
