"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("@ayana/logger"));
const body_parser_1 = require("body-parser");
const discord_js_1 = require("discord.js");
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const Profile_1 = require("../models/Profile");
exports.app = express_1.default();
const logger = logger_1.default.get(exports.app);
function startServer(bot) {
    exports.app.use(body_parser_1.urlencoded({ extended: true }));
    exports.app.use(express_1.default.static(require("path").join(process.cwd(), "views")));
    exports.app.use(express_session_1.default({
        secret: "ChaosIsCool",
        cookie: { maxAge: 86400000, secure: false },
        resave: false,
        saveUninitialized: true
    }));
    exports.app.set("views", __dirname + "/../../views");
    exports.app.set("view engine", "ejs");
    addRoutes(bot);
    exports.app.listen(3000, () => {
        logger.info("Server listening on port 3000");
    });
}
exports.startServer = startServer;
;
function addRoutes(bot) {
    exports.app.get("/", (req, res) => {
        let user = req.session.user || false;
        res.render("public", { guilds: false, user, bot });
    });
    exports.app.get("/guilds/:id", (req, res) => {
        const guild = bot.guilds.get(req.params.id);
        if (!guild)
            return res.redirect("/");
        const Guild = bot.database.getGuild(guild.id);
    });
    exports.app.get("/callback", async (req, res) => {
        if (!req.query.code)
            return res.redirect("/");
        let params = new URLSearchParams();
        params.append('client_id', "634766962378932224");
        params.append('client_secret', process.env.CLIENT_SECRET);
        params.append('grant_type', 'authorization_code');
        params.append('code', req.query.code);
        params.append('redirect_uri', 'http://localhost:3000/callback');
        params.append('scope', 'identify guilds');
        const response = await node_fetch_1.default("https://discordapp.com/api/v6/oauth2/token", {
            method: "POST",
            body: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).then((res) => res.json());
        if (response.error)
            return res.redirect("/");
        let access_token = response.access_token;
        req.session.access_token = access_token;
        const user = await node_fetch_1.default("https://discordapp.com/api/users/@me", {
            method: "GET",
            headers: { Authorization: `Bearer ${access_token}` }
        }).then((res) => res.json());
        req.session.user = user;
        let guilds = await node_fetch_1.default("https://discordapp.com/api/users/@me/guilds", {
            method: "GET",
            headers: { Authorization: `Bearer ${access_token}` }
        }).then((res) => res.json());
        guilds = guilds.filter((guild) => {
            const perms = new discord_js_1.Permissions(guild.permissions);
            return perms.has("MANAGE_GUILD", true);
        });
        res.render("public", { guilds: guilds.map(g => ({ joined: bot.guilds.has(g.id), ...g })), user, bot, invite: await bot.generateInvite(8) });
    });
    exports.app.get("/logout", (req, res) => {
        req.session.destroy((err) => {
            if (err)
                return res.status(500).json({ message: "sorry, something broke" });
            res.redirect("/");
        });
    });
    exports.app.get("/login", async (req, res) => res.redirect(await bot.generateInvite()));
    exports.app.get("/commands/:command", (req, res) => {
        let user = req.session.user || false;
        const commands = bot.commands.filter((x) => x.category.toLowerCase() === req.params.command);
        res.render("public/commands", { command: req.params.command, user, commands, bot });
    });
    exports.app.get("/leaderboard/:page", async (req, res) => {
        let user = req.session.user || false;
        let page = Number(req.params.page);
        let members = await Profile_1.ProfileEntity.find();
        members.sort((a, b) => b["x["] - a["xp"]);
        let toPush = [];
        page = Math.round(Number(page));
        for (let i = page * 10 - 10; i < page * 10; i++) {
            try {
                let user = bot.users.get(members[i].userId);
                let username = user ? user.username : "Unknown";
                toPush.push({ member: members[i], username });
            }
            catch (e) { }
        }
        res.render("public/leaderboard", { info: toPush, bot, user });
    });
    exports.app.get("/leaderboard", async (req, res) => {
        let user = req.session.user || false;
        let members = await Profile_1.ProfileEntity.find();
        members = members.sort((a, b) => b.xp - a.xp);
        members = members.slice(0, 10);
        let toPush = [];
        members.forEach((member) => {
            let user = bot.users.get(member.userId);
            let username = user ? user.username : "Unknown";
            toPush.push({ member, username });
        });
        res.render("public/leaderboard", { info: toPush, bot, user });
    });
}
