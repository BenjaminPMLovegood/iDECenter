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
        users.verify(username, password, function(user) {
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
function isAuthenticated(req, res, next) {
    if (!req.isAuthenticated()) {
        req.flash("error", "You're not logged in.");
        res.redirect("/login");
    } else {
        return next();
    }
}

function isAuthenticatedSuper(req, res, next) {
    if (!req.isAuthenticated()) {
        req.flash("error", "You're not logged in.");
        res.redirect("/login");
    } else {
        users.isSuper(req.session.passport.user.username).then(s => {
            if (!s) {
                req.flash("error", "Permission denied.");
                res.redirect("/login");
            } else {
                return next();
            }
        });
    }
}

app.get("/", function(req, res) {
    res.render("index");
});

app.get("/login", function(req, res) {
    res.locals.err = req.flash('error');
    res.render("login", { title : "Login" });
});

app.post("/register_gate", function (req, res, next) {
    if (req.isAuthenticated()) return next();
    req.flash("error", "You're not logged in.")
    res.redirect("/login");
}, function(req, res, next) {
    if (req.session.passport.username === "admin") return next();
    req.flash("error", "You're not permitted to do this.")
    res.redirect("/login");
}, passport.authenticate("register", {
    successRedirect: "/register",
    failureRedirect: "/register",
    failureFlash: true
}));

app.post("/login_gate", passport.authenticate("login", {
    successRedirect: "/api/test",
    failureRedirect: "/login",
    failureFlash: true
}));

app.all("/logout_gate", function(req, res) {
    req.logout();
    res.redirect("/");
})

app.all(/\/(api|pages)\/.*/, isAuthenticated);

app.all("/api/*", function(req, res, next) {
    console.log("api \"" + req.url + "\" called by " + req.session.passport.user.username);
    return next();
});

app.all("/api/test", isAuthenticatedSuper);

app.get("/api/test", function(req, res) {
    res.send("yes!");
});

app.get("/pages/c9", function(req, res) {
    var username = req.session.passport.user.username;

    var stmt = db.prepare("SELECT projects.name, projects.port FROM users, projects WHERE users.id = projects.owner AND user.username = ?");
    stmt.get(username, function(err, row) {
        if (typeof row !== "undefined") {
            res.render("c9wrapper_notrunning");
        } else {
            res.render("c9wrapper", { title : row.name + " - iDECenter", port : row.port })
        }
    });
    stmt.finalize();
});

app.get("/pages/templates", function(req, res) {
    res.render("pages/templates");
});

app.listen(config.port, function() {
    console.log("listening on 4040");
});

process.on('exit', function() {
    db.close();
    console.log("db closed");
});
