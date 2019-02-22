import * as express from "express";
import * as exsession from "express-session";
import flash = require("express-flash");
import * as rateLimit from "express-rate-limit";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as passport from "passport";
import { Database as sqlite3Database } from "sqlite3";
import * as log4js from "log4js";
import { Config } from "json-conf-m";
import { Strategy as LocalStrategy } from "passport-local";

const
    Docker = require("./modules/docker"),
    PathHelper = require("./modules/path_helper"),
    WorkspaceManager = require("./modules/workspace_man"),
    RouterLogger = require("./modules/router_logger"),
    GetRequester = require("./modules/get_requester"),
    TemplateCollection = require("./modules/template"),
    DatabaseAssistance = require("./modules/dba"),
    Daemon = require("./modules/daemon");

const app = express();

// config
const config = Config.FromFile("./config.json");
const templates = Config.FromFile("./templates.json").subconfig("templates");
const appConfig = config.subconfig("app", { createIfNotExists : true });

//db
// const db = new sqlite3Database(appConfig.get("database", "db.sqlite3"));
