const 
    fs = require("fs"),
    path = require("path");

function copyDir(source, dest) {
    if (!fs.existsSync(dest)) fs.mkdir(dest);

    var subs = fs.readdirSync(source);

    for (var s in subs) {
        var subpath = path.join(source, s);
        var destpath = path.join(dest, s);

        var stat = fs.fstatSync(subpath);
        if (stat.isFile()) {
            fs.copyFileSync(subpath, destpath);
        } else if (stat.isDirectory()) {
            if (!fs.existsSync(destpath)) fs.mkdir(destpath); // if destpath exists as a File? fuck it

            copyDir(subpath, destpath);
        }
    }
}

class TemplateCollection {
    constructor(templates, pathHelper) {
        this._templates = [];
        this._pathHelper = pathHelper;

        for (var v in templates) {
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

    instantiateProjectSync(templateName, projectDir, overwrite) {

    }
}

module.exports = TemplateCollection;
