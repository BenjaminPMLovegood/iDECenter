import * as express from "express";
import * as exsession from "express-session";
import flash = require("express-flash");
import * as rateLimit from "express-rate-limit";
import * as bodyParser from 'body-parser';
import * as cookieParser from "cookie-parser";
import * as passport from "passport";
import { Database } from "sqlite3";
import * as log4js from "log4js";
import * as childProcess from "child_process";

import { Auths } from "./modules/auths";
import { Docker } from "./modules/docker";
import { PathHelper } from "./modules/path_helper";
import { WorkspaceManager } from "./modules/workspace_man";
import { Strategy as LocalStrategy } from "passport-local";
import { Config } from "json-conf-m";
import { GetRequester } from "./modules/get_requester";
import { TemplateCollection } from "./modules/template";
import { DatabaseAssistant } from "./modules/dba";
import { StdioDaemon } from "./modules/daemon";
import { RoutesEnv } from "./modules/routes_env";
import { LoadRoutes } from "./modules/routes_loader";

export interface MainArgs {
    workingDirectory?: string;
}

export function main(args: MainArgs) {

const pwd = args.workingDirectory || __dirname;

const app = express();

// config
const config = Config.FromFile("./config.json");
const templatesConfig = Config.FromFile("./templates.json").subconfig("templates", { createIfNotExists : true });

const appConfig: Config = config.subconfig("app", { createIfNotExists : true });

// db
const db = new Database(appConfig.get("database") || "db.sqlite3");

// logger
log4js.configure({
    appenders : {
        "console_all" : {
            type : "console"
        },
        "console_default" : {
            type : "logLevelFilter",
            level : "INFO",
            appender : "console_all"
        },
        "logall" : {
            type : "file",
            filename : "logall.log"
        }/*,
        "daemonall" : {
            type : "file",
            filename : "daemon.log"
        }*/
    },
    categories : {
        "default" : { appenders : [ "console_default", "logall" ], level : "ALL" }, // default
        "login" : { appenders : [ "console_default", "logall" ], level : "ALL" }, // user login
        "api_critical" : { appenders : [ "console_default", "logall" ], level : "ALL" }, // access to crtical apis
        "violate" : { appenders : [ "console_default", "logall" ], level : "ALL" }, // not logged in
        "violate_super" : { appenders : [ "console_default", "logall" ], level : "ALL" }, // access to super apis/pages by non-super users
        "request" : { appenders : [ "logall" ], level : "ALL" }, // all requests
        "database" : { appenders : [ "logall", "console_all" ], level : "ALL" }, // all database ops
        "daemon" : { appenders : [ "logall", "console_default" ], level : "ALL" } // daemon
    }
});

const loggers = {
    default : log4js.getLogger("default"),
    login : log4js.getLogger("login"),
    api_critical : log4js.getLogger("api_critical"),
    violate : log4js.getLogger("violate"),
    violate_super : log4js.getLogger("violate_super"),
    request : log4js.getLogger("request"),
    database : log4js.getLogger("database"),
    daemon : log4js.getLogger("daemon")
};

loggers.default.info("loggers ready");

// daemon
loggers.default.info("launching daemon client...");
const daemonp = childProcess.spawn("dotnet", [ config.get("daemon.path"), "./config.json" ] , { stdio : "pipe" });

daemonp.on("exit", (code, signal) => {
    loggers.default.info("daemon exit with code", code);
    loggers.daemon.info("daemon exit with code", code);
    loggers.daemon.info("signal is", signal);
});

const daemon = new StdioDaemon(daemonp, loggers.daemon);

// modules
const docker = new Docker(daemon);
const ph = new PathHelper(pwd);
const dba = new DatabaseAssistant(db, loggers.database, docker);
const templates = new TemplateCollection(templatesConfig, ph, daemon);
const workspaceManager = new WorkspaceManager(ph.getPath(config.get("projects.workspace")), ph.getPath(config.get("projects.archive")), daemon);

docker.startRefresher();

// env
const env: RoutesEnv = { 
    config : config, 
    daemon : daemon,
    db : db, 
    dba : dba,
    docker : docker,
    passport : passport,
    templates : templates,
    workspaceManager : workspaceManager
};

loggers.default.info("modules ready");

// log4js.configure app
loggers.default.info("configuring app...");
app.set("trust proxy", true);
app.set("views", ph.getPath("views"));
app.set("view engine", "pug");

// middlewares
loggers.default.info("loading express middlewares...");
app.use(cookieParser());
app.use(exsession(appConfig.get("session")));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var critical_apis = [
    "/apisuper/adduser",
    "/apisuper/shutdown",
    "/api/create_project"
];

function isCriticalApi(url: string): boolean {
    if (critical_apis.includes(url)) return true;

    if (url[url.length- 1] == '/') return critical_apis.includes(url.substring(0, url.length - 1));
    return false;
}

app.use((req, res, next) => {
    if (isCriticalApi(req.originalUrl)) {
        loggers.api_critical.info(`critical api ${req.originalUrl} requested by ${GetRequester(req)}`);
    } else {
        loggers.request.info(`url ${req.originalUrl} requested by ${GetRequester(req)}`);
    }

    return next();
});

app.get("*", (req, res, next) => {
    res.locals.err = req.flash('error');
    return next();
})

app.use("/scripts", express.static("scripts"));

passport.use("login", new LocalStrategy(
    function (username, password, done) {
        env.dba.verifyUser(username, password).then(user => {
            loggers.login.info("user %s(%d) logging in", user.username, user.id);
            done(null, user);
        }).catch(err => {
            loggers.login.warn("failed login attempt with %s:%s", username, password);
            loggers.login.warn("    ", err);
            done(null, false, { message: err });
        });
    }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// routes
const auths = Auths(env.dba, loggers.violate, loggers.violate_super);

loggers.default.info("loading routes...");

// app.use("/register_gate", rateLimit({ windowMs : 60 * 1000, max : 1 }));
app.use("/", LoadRoutes(__dirname + "/routes/root")(env));

app.all("/api/*", auths.isAuthenticatedForApi);
// disabled temporarily for debug
// app.use("/api/create_project", rateLimit({ windowMs : 2 * 60 * 1000, max : 2 }));
app.use("/api", LoadRoutes(__dirname + "/routes/api")(env));

app.all("/pages/*", auths.isAuthenticated);
app.use("/pages", LoadRoutes(__dirname + "/routes/page")(env));

app.all("/pagesuper/*", auths.isAuthenticatedSuper);
app.use("/pagesuper", LoadRoutes(__dirname + "/routes/pagesuper")(env));

app.all("/apisuper/*", auths.isAuthenticatedSuperForApi);
app.use("/apisuper", LoadRoutes(__dirname + "/routes/apisuper")(env));

// 404
app.all("*", (req, res) => res.status(404).send("Ich kann es nicht finden."))

// run! app, run!
var port = appConfig.get("port") - 0;
app.listen(port, function() {
    loggers.default.info("listening on %d...", port);
});

process.on('exit', function() {
    loggers.default.info("server exiting...");
    loggers.default.info("saving config...");
    config.save(true);
    loggers.default.info("config saved, closing other modules...");

    if (env.docker) env.docker.closeRefresher();
    env.daemon.close();
    db.close();

    loggers.default.info("closing logger, goodbye");
    log4js.shutdown();
});
}