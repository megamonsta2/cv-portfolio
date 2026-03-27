import express, { type ErrorRequestHandler } from "express";
import { createHash } from "crypto";
import cors from "cors";
import { query } from "./routes/base.js";
import getCVsRouter from "./routes/getcvs.js";
import updateRouter from "./routes/update.js";
import { deleteSession, getSession, setSession } from "./sessions.js";

const app = express();
const port = 7004;

function main() {
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.get("/", (req, res) => {
        res.json({ success: true });
    });
    app.use("/getcvs", getCVsRouter);
    app.use("/update", updateRouter);
    setupAccounts();

    app.use(((err, req, res, next) => {
        const statusCode = err.statusCode || 500;
        const errMsg = err instanceof Error ? err.message : String(err);

        console.error(err);
        res.status(statusCode).json({
            success: false,
            msg: "An error occurred!",
            error: errMsg,
        });
    }) as ErrorRequestHandler);
    app.listen(port, () =>
        console.log(`Server listening at http://localhost:${port}`),
    );
}

function setupAccounts() {
    app.post("/register", async function (req, res, next) {
        const { name, email, password } = req.body;
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        )
            return res.json({ success: false, msg: "Invalid inputs!" });

        try {
            const existingAccounts = await query<[unknown]>(
                "SELECT id FROM accounts WHERE email=?",
                [email],
            );
            if (existingAccounts.length > 0)
                return res.json({
                    success: false,
                    msg: "This email is taken!",
                });

            const passHash = hash(password);
            await query(
                "INSERT INTO accounts (name, email, password) VALUES (?, ?, ?)",
                [name, email, passHash],
            );
            const result = await query<[{ id: number }]>(
                "SELECT id FROM accounts WHERE email=?",
                [email],
            );

            const sessionId = hash();
            setSession(sessionId, result[0].id);
            res.json({ success: true, data: { name, sessionId } });
        } catch (err) {
            console.error(`Error while registering ${req.body}`, err);
            next(err);
        }
    });
    app.post("/login", async function (req, res, next) {
        const { email, password } = req.body;
        if (typeof email !== "string" || typeof password !== "string")
            return res.json({ success: false, msg: "Invalid inputs!" });

        try {
            const accounts = await query<
                [{ id: number; name: string; password: string }]
            >("SELECT id,name,password FROM accounts WHERE email=?", [email]);

            const account = accounts[0];
            if (!account)
                return res.json({
                    success: false,
                    msg: "Account doesn't exist!",
                });

            const passHash = hash(password);
            if (passHash !== account.password)
                return res.json({ success: false, msg: "Incorrect password!" });

            const sessionId = hash();
            setSession(sessionId, account.id);
            res.json({
                success: true,
                data: { name: account.name, sessionId },
            });
        } catch (err) {
            console.error(`Error while logging in ${req.body}`, err);
            next(err);
        }
    });
    app.post("/logout", async function (req, res, next) {
        const sessionId = req.body.sessionId;
        if (typeof sessionId !== "string")
            return res.json({ success: false, msg: "Invalid input!" });

        try {
            const id = getSession(sessionId);
            if (!id)
                return res.json({
                    success: false,
                    msg: "You are not logged in!",
                });

            deleteSession(sessionId);
            res.json({ success: true });
        } catch (err) {
            console.error(`Error while logging out ${req.body}`, err);
            next(err);
        }
    });
}

function hash(text?: string) {
    return createHash("sha512")
        .update(text ?? Math.random().toString())
        .digest("hex");
}

main();
