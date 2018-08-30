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
    PathHelper = require("./modules/path_helper"),
    WorkspaceManager = require("./modules/workspace_man"),
    UserCollection = require("./classes/user"),
    ProjectCollection = require("./classes/project"),
    TemplateCollection = require("./classes/template");

// config
const config = require("./config.json");

// logger
// category:
//  "main" - main js
//  "login" - login, logout
//  "api" - api calls
//  "api_critical" - critical api calls
//  "violate" - someone not logged in trying to call apis or request pages
//  "violate_super" - someone not super trying to call super apis or request super pages
//  "page" - page requests
//  "database" - database
log4js.configure({
    appenders : {
        "console_out" : {
            type : "console"
        },
        "console_gtr_info" : {
            type : "logLevelFilter",
            level : "INFO",
            appender : "console_out"
        },
        "logall" : {
            type : "file",
            filename : "logall.log"
        }
    },
    categories : {
        "default" : { appenders : [ "console_gtr_info", "logall" ], level : "ALL" },
        "login" : { appenders : [ "console_gtr_info", "logall" ], level : "ALL" },
        "api" : { appenders : [ "logall" ], level : "ALL" },
        "api_critical" : { appenders : [ "console_gtr_info", "logall" ], level : "ALL" },
        "violate" : { appenders : [ "console_gtr_info", "logall" ], level : "ALL" },
        "violate_super" : { appenders : [ "console_gtr_info", "logall" ], level : "ALL" },
        "page" : { appenders : [ "logall" ], level : "ALL" },
        "database" : { appenders : [ "logall" ], level : "ALL" }
    }
});

const loggers = {
    default : log4js.getLogger("default"),
    login : log4js.getLogger("login"),
    api : log4js.getLogger("api"),
    api_critical : log4js.getLogger("api_critical"),
    violate : log4js.getLogger("violate"),
    violate_super : log4js.getLogger("violate_super"),
    page : log4js.getLogger("page"),
    database : log4js.getLogger("database")
};

loggers.default.info("logger ready");

// models
const
    db = new sqlite3.Database(config.database),
    ph = new PathHelper(__dirname),
    users = new UserCollection(db),
    projects = new ProjectCollection(db, config.c9portbase - 0), // a very "amazing" type system
    templates = new TemplateCollection(config.templates, ph),
    wm = new WorkspaceManager(ph.getPath(config.workspace));

const env = { users : users, projects : projects, templates : templates, passport : passport, pathHelper : ph, workspaceManager : wm, loggers : loggers };
projects.startDaemon();

// configurate app
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

app.use("/scripts", express.static("scripts"));

passport.use("login", new LocalStrategy(
    function (username, password, done) {
        users.verify(username, password).then(user => {
            if (user) {
                loggers.login.info("user %s(%d) loggin in", user.username, user.id);
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

app.all("/apisuper/*", auths.isAuthenticatedSuperForApi);
app.use("/apisuper", require("./routes/apisuper")(env));

// run! app, run!
app.listen(config.port, function() {
    loggers.default.info("listening on %d...", config.port);
});

process.on('exit', function() {
    if (projects) projects.closeDaemon();
    db.close();
    loggers.default.info("exited.");
});
