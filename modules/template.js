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

    async instantiateProject(templateName, projectDir) {
        return new Promise((resolve, reject) => {
            if (!this.templateExists(templateName)) reject("template not exists");

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
