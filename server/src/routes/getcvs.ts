import { getSession } from "../sessions.js";
import { query } from "./base.js";
import express from "express";

const router = express.Router();
export default router;

async function getAccountFromId(id: string): Promise<Record<string, unknown>> {
    const accounts = await query<[unknown]>(
        "SELECT name,email,aboutme,education FROM accounts WHERE id=?",
        [id],
    );
    const account = accounts[0];
    if (!account) return { success: false, message: "No data for account" };

    // These are all separate, so there aren't 9 million rows because one account has 5 langs and 4 links (so 20+ rows for that single account)
    const [langs, links] = await Promise.all([
        query("SELECT id,lang FROM codelangs WHERE account_id=?", [id]),
        query("SELECT id,link,type FROM links WHERE account_id=?", [id]),
    ]);

    return { success: true, data: { account, langs, links } };
}

router.get("/", async function (req, res, next) {
    try {
        const [accounts, langs] = await Promise.all([
            query("SELECT id,name,email FROM accounts"),
            query("SELECT account_id,lang FROM codelangs"),
        ]);
        res.json({ success: true, data: { accounts, langs } });
    } catch (err) {
        console.error("Error while getting all cvs", err);
        next(err);
    }
});
router.get("/:id", async function (req, res, next) {
    const id = req.params.id;
    try {
        res.json(await getAccountFromId(id));
    } catch (err) {
        console.error(`Error while getting cv with id ${id}`, err);
        next(err);
    }
});
router.get("/bysession/:sessionid", async function (req, res, next) {
    const sessionid = req.params.sessionid;
    try {
        const id = getSession(sessionid);
        if (!id) return res.json({ success: false, msg: "Invalid session" });

        res.json(await getAccountFromId(String(id)));
    } catch (err) {
        console.error(
            `Error while getting cv with session id ${sessionid}`,
            err,
        );
        next(err);
    }
});
router.get("/byname/:query", async function (req, res, next) {
    const text = req.params.query;
    try {
        const accounts = await query<[{ id: number }]>(
            "SELECT id,name,email FROM accounts WHERE name LIKE ?",
            [`%${text}%`],
        );

        const ids = Object.values(accounts).map((account) => account.id);
        const langs = await query(
            "SELECT account_id,lang FROM codelangs WHERE account_id IN (?)",
            [ids.join(",")],
        );

        res.json({ success: true, data: { accounts, langs } });
    } catch (err) {
        console.error(`Error while getting cv via name search ${text}`, err);
        next(err);
    }
});
router.get("/bylang/:query", async function (req, res, next) {
    const text = req.params.query;
    try {
        const accounts = await query<[{ id: number }]>(
            "SELECT id,name,email FROM accounts WHERE id IN (SELECT account_id FROM codelangs WHERE lang LIKE ?)",
            [`%${text}%`],
        );

        const ids = Object.values(accounts).map((account) => account.id);
        const langs = await query(
            "SELECT account_id,lang FROM codelangs WHERE account_id IN (?)",
            [ids.join(",")],
        );

        res.json({ success: true, data: { accounts, langs } });
    } catch (err) {
        console.error(`Error while getting cv via lang search ${text}`, err);
        next(err);
    }
});
