class TemplateCollection {
    constructor(templates, env) {
        this._templatesConf = templates;
        this._templates = {};
        this._pathHelper = env.ph;
        this._daemon = env.daemon;

        for (var i in templates.getAll()) {
            var v = templates.get(i);
            this._templates[v.name] = this._processNode(v.root);
        }
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
        return Object.keys(this._templates);
    }

    templateExists(templateName) {
        return templateName in this._templates;
    }

    add(v) {
        this._templatesConf.set(v.name, v);
        this._templates[v.name] = this._processNode(v.root);
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
