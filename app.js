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

// models
const
    db = new sqlite3.Database(config.database),
    ph = new PathHelper(__dirname),
    users = new UserCollection(db),
    projects = new ProjectCollection(db, config.c9portbase - 0), // a very "amazing" type system
    templates = new TemplateCollection(config.templates, ph),
    wm = new WorkspaceManager(ph.getPath(config.workspace));

projects.startDaemon();

// configurate app
app.set("trust proxy", true);
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

// middlewares
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
        users.verify(username, password).then(function(user) {
            if (user) {
                done(null, user);
            } else {
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
const env = { users : users, projects : projects, templates : templates, passport : passport, pathHelper : ph, workspaceManager : wm };
const auths = require("./modules/auths")(env);

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
app.listen(config.port, function() {
    console.log("listening on", config.port);
});

process.on('exit', function() {
    if (projects) projects.closeDaemon();
    db.close();
    console.log("db closed");
});
