// modules
const
    express = require("express"),
    exsession = require("express-session"),
    flash = require("express-flash"),
    bodyParser = require('body-parser'),
    cookieParser = require("cookie-parser"),
    passport = require("passport"),
    LocalStrategy = require("passport-local").Strategy,
    sqlite3 = require("sqlite3"),

    app = express();

// submodules
const
    sha1 = require("./scripts/sha1"),
    serversalt = require("./private_scripts/server_salt"),
    usernameCheck = require("./scripts/check_username"),
    auths = require("./modules/auths"),
    UserCollection = require("./classes/user");

// config
const config = require("./config.json");

// models
const
    db = new sqlite3.Database(config.database),
    users = new UserCollection(db);

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
app.use("/", require("./routes/root"));

app.post("/login_gate", passport.authenticate("login", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}));

app.all("/api/*", auths.isAuthenticatedForApi);

app.all("/api/*", function(req, res, next) {
    console.log("api \"" + req.url + "\" called by " + req.session.passport.user.username);
    return next();
});

app.all("/api/test", auths.isAuthenticatedSuperForApi(users));

app.get("/api/test", function(req, res) {
    res.send("yes!");
});

app.all("/pages/*", auths.isAuthenticated);
app.use("/pages", require("./routes/pages"));

app.listen(config.port, function() {
    console.log("listening on", config.port);
});

process.on('exit', function() {
    db.close();
    console.log("db closed");
});
