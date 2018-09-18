// modules
const
    express = require("express"),
    exsession = require("express-session"),
    flash = require("express-flash"),
    rateLimit = require("express-rate-limit"),
    bodyParser = require('body-parser'),
    cookieParser = require("cookie-parser"),
    passport = require("passport"),
    LocalStrategy = require("passport-local").Strategy,
    sqlite3 = require("sqlite3"),
    log4js = require("log4js"),

    app = express();

// submodules
const
    Docker = require("./modules/docker"),
    PathHelper = require("./modules/path_helper"),
    WorkspaceManager = require("./modules/workspace_man"),
    RouterLogger = require("./modules/router_logger"),
    GetRequester = require("./modules/get_requester"),
    UserCollection = require("./classes/user"),
    ProjectCollection = require("./classes/project"),
    TemplateCollection = require("./classes/template"),
    Daemon = require("./modules/daemon");

// config
const config = require("./config.json");

// db
const db = new sqlite3.Database(config.database);

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
        }
    },
    categories : {
        "default" : { appenders : [ "console_default", "logall" ], level : "ALL" }, // default
        "login" : { appenders : [ "console_default", "logall" ], level : "ALL" }, // user login
        "api_critical" : { appenders : [ "console_default", "logall" ], level : "ALL" }, // access to crtical apis
        "violate" : { appenders : [ "console_default", "logall" ], level : "ALL" }, // not logged in
        "violate_super" : { appenders : [ "console_default", "logall" ], level : "ALL" }, // access to super apis/pages by non-super users
        "request" : { appenders : [ "logall" ], level : "ALL" }, // all requests
        "database" : { appenders : [ "logall" ], level : "ALL" }, // all database ops
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
loggers.default.info("logger ready");

// daemon
const daemon = new Daemon(config.daemonport, env);
env.daemon = daemon;

// modules
const docker = Docker(env);
env.docker = docker;

const ph = new PathHelper(__dirname);
env.ph = ph;

const users = new UserCollection(db);
env.users = users;

const projects = new ProjectCollection(env, config.c9portbase - 0); // a very "amazing" type system
env.projects = projects;

const templates = new TemplateCollection(config.templates, ph);
env.templates = templates;

const wm = new WorkspaceManager(ph.getPath(config.workspace));
env.workspaceManager = wm;

projects.startDaemon();

loggers.default.info("modules ready");

// configure app
app.set("trust proxy", true);
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

// middlewares
loggers.default.info("loading express middlewares...");
app.use(cookieParser());
app.use(exsession({
    secret : config.session.secret,
    name : config.session.cookie,
    cookie : {
        maxAge : config.session.maxAge,
        httpOnly : true
    },
    resave : true,
    rolling : true,
    saveUninitialized : false
}));
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

app.use("/scripts", express.static("scripts"));

passport.use("login", new LocalStrategy(
    function (username, password, done) {
        users.verify(username, password).then(user => {
            if (user) {
                loggers.login.info("user %s(%d) logging in", user.username, user.id);
                done(null, user);
            } else {
                loggers.login.info("failed login attempt with %s:%s", username, password);
                done(null, false, { message: "Incorrect username or password." });
            }
        });
    }
));

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

// routes
const auths = require("./modules/auths")(env);

loggers.default.info("loading routes...");
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
loggers.default.info("launching daemon server...")
daemon.listen(() => {
    app.listen(config.port, function() {
        loggers.default.info("listening on %d...", config.port);
    });
});

loggers.default.info("launching daemon client...");
require("child_process").exec(`${config.daemonpath} ./config.json`, (error, stdout, stderr) => {
    if (error) {
        loggers.daemon.error("daemon exit with code", error.code);
        loggers.daemon.error("stderr is", stderr);
    } else {
        loggers.daemon.info("daemon exit normally");
    }

    loggers.daemon.info("stdout is", stdout);
});

process.on('exit', function() {
    if (projects) projects.closeDaemon();
    daemon.close();
    db.close();
    loggers.default.info("server exiting, closing logger, goodbye");
    log4js.shutdown();
});
