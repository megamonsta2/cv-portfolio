import { getSession } from "../sessions.js";
import { query } from "./base.js";
import express from "express";

const router = express.Router();
export default router;

const linkTypes = ["linkedin", "x", "instagram", "youtube"];

router.post("/about-me", async (req, res, next) => {
    const { sessionid, text } = req.body;
    if (typeof sessionid !== "string" || typeof text !== "string")
        return res.json({ success: false, msg: "Invalid inputs!" });

    try {
        const id = getSession(sessionid);
        if (!id) return res.json({ success: false, msg: "Invalid session" });
        await query("UPDATE accounts SET aboutme=? WHERE id=?", [text, id]);

        res.json({ success: true });
    } catch (err) {
        console.error(`Error while updating about me ${req.body}`, err);
        next(err);
    }
});
router.post("/education", async (req, res, next) => {
    const { sessionid, text } = req.body;
    if (typeof sessionid !== "string" || typeof text !== "string")
        return res.json({ success: false, msg: "Invalid inputs!" });

    try {
        const id = getSession(sessionid);
        if (!id) return res.json({ success: false, msg: "Invalid session" });
        await query("UPDATE accounts SET education=? WHERE id=?", [text, id]);

        res.json({ success: true });
    } catch (err) {
        console.error(`Error while updating education ${req.body}`, err);
        next(err);
    }
});
router.post("/langs/add", async (req, res, next) => {
    const { sessionid, lang } = req.body;
    if (typeof sessionid !== "string" || typeof lang !== "string")
        return res.json({ success: false, msg: "Invalid inputs!" });

    try {
        const id = getSession(sessionid);
        if (!id) return res.json({ success: false, msg: "Invalid session" });

        const existsResult = await query<[unknown]>(
            "SELECT id FROM codelangs WHERE account_id=? AND lang=?",
            [id, lang],
        );
        if (existsResult.length > 0)
            return res.json({
                success: false,
                msg: "Language already exists",
            });

        await query("INSERT INTO codelangs (account_id, lang) VALUES (?, ?)", [
            id,
            lang,
        ]);
        const result = await query<[{ id: number }]>(
            "SELECT id FROM codelangs WHERE account_id=? AND lang=?",
            [id, lang],
        );
        res.json({ success: true, data: { id: result[0].id } });
    } catch (err) {
        console.error(`Error while adding code lang ${req.body}`, err);
        next(err);
    }
});
router.post("/langs/delete", async (req, res, next) => {
    const { sessionid, langid } = req.body;
    if (typeof sessionid !== "string" || typeof langid !== "number")
        return res.json({ success: false, msg: "Invalid inputs!" });

    try {
        const accountid = getSession(sessionid);
        if (!accountid)
            return res.json({ success: false, msg: "Invalid session" });

        await query("DELETE FROM codelangs WHERE id=? AND account_id=?", [
            langid,
            accountid,
        ]);
        res.json({ success: true });
    } catch (err) {
        console.error(`Error while deleting code lang ${req.body}`, err);
        next(err);
    }
});
router.post("/links/add", async (req, res, next) => {
    const { sessionid, link, type } = req.body;
    if (typeof sessionid !== "string" || !linkTypes.includes(type))
        return res.json({ success: false, msg: "Invalid inputs!" });

    try {
        const id = getSession(sessionid);
        if (!id) return res.json({ success: false, msg: "Invalid session" });

        const existsResult = await query<[unknown]>(
            "SELECT id FROM links WHERE account_id=? AND link=? AND type=?",
            [id, link, type],
        );
        if (existsResult.length > 0)
            return res.json({
                success: false,
                msg: "Link already exists",
            });

        await query(
            "INSERT INTO links (account_id, link, type) VALUES (?, ?, ?)",
            [id, link, type],
        );
        const result = await query<[{ id: number }]>(
            "SELECT id FROM links WHERE account_id=? AND link=? AND type=?",
            [id, link, type],
        );
        res.json({ success: true, data: { id: result[0].id } });
    } catch (err) {
        console.error(`Error while adding link ${req.body}`, err);
        next(err);
    }
});
router.post("/links/delete", async (req, res, next) => {
    const { sessionid, linkid } = req.body;
    if (typeof sessionid !== "string" || typeof linkid !== "number")
        return res.json({ success: false, msg: "Invalid inputs!" });

    try {
        const accountid = getSession(sessionid);
        if (!accountid)
            return res.json({ success: false, msg: "Invalid session" });

        await query("DELETE FROM links WHERE id=? AND account_id=?", [
            linkid,
            accountid,
        ]);
        res.json({ success: true });
    } catch (err) {
        console.error(`Error while deleting link ${req.body}`, err);
        next(err);
    }
});
