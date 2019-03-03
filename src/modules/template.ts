import { Config } from "json-conf-m";
import PathHelper from "./path_helper";
import StdioDaemon from "./daemon";

export interface Template {
    name: string;
    root: TemplateNode;
}

export interface TemplateNode {
    path: string;
    shared?: boolean;
    readonly?: boolean;
    sub?: {
        [ path: string ] : TemplateNode;
    }
}

export default class TemplateCollection {
    _templatesConf: Config;
    _pathHelper: PathHelper;
    _daemon: StdioDaemon;
    _templates: { [ name: string ]: TemplateNode };

    constructor(templates: Config, ph: PathHelper, daemon: StdioDaemon) {
        this._templatesConf = templates;
        this._templates = {};
        this._pathHelper = ph;
        this._daemon = daemon;

        for (var i in templates.getAll()) {
            var v = templates.get(i);
            this._templates[v.name] = this._processNode(v.root);
        }
    }

    _processNode(node: TemplateNode): TemplateNode {
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

    templateExists(templateName: string) {
        return templateName in this._templates;
    }

    add(v: Template) {
        this._templatesConf.set(v.name, v);
        this._templatesConf.save(true);
        this._templates[v.name] = this._processNode(v.root);
    }

    async instantiateProject(templateName: string, projectDir: string) {
        return new Promise((resolve, reject) => {
            if (!this.templateExists(templateName)) reject("template not exists");

            var root = this._templates[templateName];
            var projectDirAbs = this._pathHelper.getPath(projectDir);

            this._daemon.acallt<{ dirmap: any, error: any }>("projmgr", "instantiate", { root : root, target : projectDirAbs }).then(v => {
                if (v.dirmap) {
                    resolve(v.dirmap);
                } else {
                    reject(v.error);
                }
            });
        });
    }
}
