// modules
const
    express = require("express"),
    exsession = require("express-session"),
    flash = require("express-flash"),
    bodyParser = require('body-parser'),
    cookieParser = require("cookie-parser"),
    passport = require("passport"),
    LocalStrategy = require("passport-local").Strategy,
    sha1 = require("./scripts/sha1"),
    salt = require("./salt")
    sqlite3 = require("sqlite3"),

    db = new sqlite3.Database("db.sqlite3"),

    app = express();

// config
const
    config = require("./config.json"),
    c9path = config.c9sdk || "./c9/",
    port = config.port || 4040,
    c9baseport = config.c9baseport || 4041,
    sessionConf = config.sessionConf || { maxAge : 1000 * 60 * 10, secret : "gouliguojia", cookie : "idecsid" };

// configurate app
app.set("trust proxy", true);
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

// middlewares
app.use(cookieParser());
app.use(exsession({
    secret : sessionConf.secret,
    name : sessionConf.cookie,
    cookie : {
        maxAge : sessionConf.maxAge,
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

/* used to insert user 
passport.use("mem", new LocalStrategy(
    function (username, password, done) {
        var user = {
            id: "1",
            username: "admin",
            password: "pass"
        };

        var stmt = db.prepare("INSERT INTO users(username, password) VALUES (?, ?)");
        stmt.run(username, sha1(salt(username, password)));
        stmt.finalize();

        user.password = password;
        return done(null, { username : username, password : password });

        if (username !== user.username) {
            return done(null, false, { message: "Incorrect username." });
        }
        if (password !== user.password) {
            return done(null, false, { message: "Incorrect password." });
        }

        return done(null, user);
    }
));
*/

passport.use("mem", new LocalStrategy(
    function (username, password, done) {
        var newPassword = sha1(salt(username, password));

        var stmt = db.prepare("SELECT id, username, password FROM users WHERE username = ? AND password = ?");
        stmt.get(username, newPassword, function(err, row) {
            if (typeof row !== "undefined") {
                done(null, { id : row.id, username : row.username, password : row.password });
            } else {
                done(null, false, { message: "Incorrect username or password." });
            }
        });
        stmt.finalize();
    }
));

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

// routes
app.get("/", function(req, res) {
    res.render("index");
});

app.get("/login", function(req, res) {
    res.locals.err = req.flash('error');
    res.render("login", { title : "Login" });
});

app.post("/login_gate", passport.authenticate("mem", {
    successRedirect: "/api/test",
    failureRedirect: "/login",
    failureFlash: true
}));

app.all("/logout_gate", function(req, res) {
    req.logout();
    res.redirect("/");
})

app.all("/api/*", function(req, res, next) {
    if (req.isAuthenticated()) return next();
    req.flash("error", "You're not logged in.")
    res.redirect("/login");
});

app.get("/api/*", function(req, res) {
    res.send("api \"" + req.url + "\" called by " + req.session.passport.user.username);
});

app.all("/pages/*", function(req, res, next) {
    if (req.isAuthenticated()) return next();
    req.flash("error", "You're not logged in.")
    res.redirect("/login");
});

app.all("/pages/*", function(req, res) {

});

app.listen(port, function() {
    console.log("listening on 4040");
});

process.on('exit', function() {
    db.close();
    console.log("db closed");
});
