require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// GOOGLE
// =========================

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL
        },
        (accessToken, refreshToken, profile, done) => {

            const user = {
                id: profile.id,
                name: profile.displayName || "Google User",
                email: profile.emails?.[0]?.value || "",
                photo: profile.photos?.[0]?.value || ""
            };

            done(null, user);
        }
    )
);

// =========================
// PASSPORT
// =========================

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// =========================
// EXPRESS
// =========================

app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET || "weather-world-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false,
            maxAge: 7 * 24 * 60 * 60 * 1000
        }
    })
);

app.use(passport.initialize());
app.use(passport.session());

// =========================
// WEBSITE
// =========================

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// =========================
// GOOGLE LOGIN
// =========================

app.get(
    "/auth/google",
    passport.authenticate("google", {
        scope: ["profile", "email"]
    })
);

// =========================
// GOOGLE CALLBACK
// =========================

app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/"
    }),
    (req, res) => {
        res.redirect("/");
    }
);

// =========================
// CURRENT USER
// =========================

app.get("/api/user", (req, res) => {

    if (!req.isAuthenticated()) {
        return res.json({
            loggedIn: false
        });
    }

    res.json({
        loggedIn: true,
        user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            photo: req.user.photo
        }
    });
});

// =========================
// LOGOUT
// =========================

app.get("/logout", (req, res) => {

    req.logout((err) => {

        if (err) {
            return res.status(500).json({
                error: "Ошибка выхода"
            });
        }

        req.session.destroy(() => {
            res.redirect("/");
        });
    });
});

// =========================
// SERVER
// =========================

app.listen(PORT, () => {

    console.log("");
    console.log("================================");
    console.log("🌍 Weather World запущен!");
    console.log("================================");
    console.log(`http://localhost:${PORT}`);
    console.log("");

});