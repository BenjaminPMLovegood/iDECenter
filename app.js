const
    express = require("express"),
    exsession = require("express-session"),
    flash = require("express-flash"),
    rateLimit = require("express-rate-limit"),
    bodyParser = require('body-parser'),
    cookieParser = require("cookie-parser"),
    passport = require("passport"),
    sqlite3 = require("sqlite3"),
    log4js = require("log4js");

const
    Docker = require("./modules/docker"),
    PathHelper = require("./modules/path_helper"),
    WorkspaceManager = require("./modules/workspace_man"),
    RouterLogger = require("./modules/router_logger"),
    LocalStrategy = require("passport-local").Strategy,
    Config = require("json-conf-m").Config,
    GetRequester = require("./modules/get_requester"),
    TemplateCollection = require("./modules/template"),
    DatabaseAssistance = require("./modules/dba"),
    Daemon = require("./modules/daemon");

const app = express();

// config
const config = Config.FromFile("./config.json");
const templates = Config.FromFile("./templates.json").subconfig("templates");

const appConfig = config.subconfig("app");

// db
const db = new sqlite3.Database(app.get("database") || "db.sqlite3");

// env
const env = { config : config, db : db, passport : passport };

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

env.loggers = loggers;
loggers.default.info("loggers ready");

// daemon
loggers.default.info("launching daemon client...");
const daemonp = require("child_process").spawn("dotnet", [ config.get("daemon.path"), "./config.json" ] , { stdio : "pipe" });

daemonp.on("exit", (code, signal) => {
    loggers.default.info("daemon exit with code", code);
    loggers.daemon.info("daemon exit with code", code);
    loggers.daemon.info("signal is", signal);
});

env.daemon = new Daemon(daemonp, env);

// modules
env.docker = Docker(env);
env.ph = new PathHelper(__dirname);
env.dba = new DatabaseAssistance(env);
env.templates = new TemplateCollection(templates, env);
env.workspaceManager = new WorkspaceManager(env.ph.getPath(config.get("projects.workspace")), env.ph.getPath(config.get("projects.archive")), env);

env.docker.startRefresher();

loggers.default.info("modules ready");

// configure app
loggers.default.info("configuring app...");
app.set("trust proxy", true);
app.set("views", __dirname + "/views");
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

critical_apis = [
    "/apisuper/adduser",
    "/apisuper/shutdown",
    "/api/create_project"
]

function isCriticalApi(url) {
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
const auths = require("./modules/auths")(env);

loggers.default.info("loading routes...");

// app.use("/register_gate", rateLimit({ windowMs : 60 * 1000, max : 1 }));
app.use("/", require("./routes/root")(env));

app.all("/api/*", auths.isAuthenticatedForApi);
// disabled temporarily for debug
// app.use("/api/create_project", rateLimit({ windowMs : 2 * 60 * 1000, max : 2 }));
app.use("/api", require("./routes/api")(env));

app.all("/pages/*", auths.isAuthenticated);
app.use("/pages", require("./routes/page")(env));

app.all("/pagesuper/*", auths.isAuthenticatedSuper);
app.use("/pagesuper", require("./routes/pagesuper")(env));

app.all("/apisuper/*", auths.isAuthenticatedSuperForApi);
app.use("/apisuper", require("./routes/apisuper")(env));

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
    daemon.close();
    db.close();

    loggers.default.info("closing logger, goodbye");
    log4js.shutdown();
});
