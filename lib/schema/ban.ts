import { sqlite } from "src";
import { isJidUser, isLidUser } from "baileys";

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS ban_user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jid TEXT UNIQUE,
    lid TEXT
  )
`);

export default {
	add: (jid: string, lid: string) => {
		if (!isJidUser(jid)) throw new Error("Invalid JID format");
		if (!isLidUser(lid)) throw new Error("Invalid LID format");

		const exists = sqlite.query("SELECT 1 FROM ban_user WHERE jid = ?").get(jid);
		if (!exists) {
			sqlite.run("INSERT INTO ban_user (jid, lid) VALUES (?, ?)", [jid, lid]);
		}
		return { jid, lid };
	},

	list: (banType: "jid" | "lid" = "jid") => {
		return sqlite
			.query(`SELECT ${banType} FROM ban_user WHERE ${banType} IS NOT NULL`)
			.all()
			.map((row: any) => row[banType])
			.filter(Boolean) as string[];
	},

	remove: (user: string) => {
		const field = isJidUser(user) ? "jid" : isLidUser(user) ? "lid" : undefined;
		if (!field) throw new Error("Invalid user format");

		sqlite.run(`DELETE FROM ban_user WHERE ${field} = ?`, [user]);
		return { success: true, user };
	},

	check: (user: string) => {
		const field = isJidUser(user) ? "jid" : isLidUser(user) ? "lid" : undefined;
		if (!field) return false;

		return !!sqlite.query(`SELECT 1 FROM ban_user WHERE ${field} = ?`).get(user);
	},

	count: () => {
		const result = sqlite
			.query("SELECT COUNT(*) as count FROM ban_user")
			.get() as { count: number };
		return result.count;
	},
};
