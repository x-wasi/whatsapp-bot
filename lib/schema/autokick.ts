import { sqlite } from "src";

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS autokick (
    groupJid TEXT PRIMARY KEY,
    jid TEXT,
    lid TEXT
  )
`);

export default {
	set: (groupJid: string, jid: string | null, lid: string | null) => {
		const exists = sqlite
			.query("SELECT 1 FROM autokick WHERE groupJid = ?")
			.get(groupJid);

		if (exists) {
			sqlite.run("UPDATE autokick SET jid = ?, lid = ? WHERE groupJid = ?", [
				jid,
				lid,
				groupJid,
			]);
		} else {
			sqlite.run("INSERT INTO autokick (groupJid, jid, lid) VALUES (?, ?, ?)", [
				groupJid,
				jid,
				lid,
			]);
		}

		return true;
	},

	remove: (groupJid: string) => {
		sqlite.run("DELETE FROM autokick WHERE groupJid = ?", [groupJid]);
		const result = sqlite.query("SELECT changes() AS changes").get();
		if (result && typeof result === "object" && "changes" in result) {
			return (result as { changes: number }).changes;
		}
		return 0;
	},

	get: (groupJid: string, id: string) => {
		const result = sqlite
			.query("SELECT jid, lid FROM autokick WHERE groupJid = ?")
			.get(groupJid) as { jid: string; lid: string } | null;

		if (!result) return false;
		return result.jid === id || result.lid === id;
	},

	list: () => {
		return sqlite
			.query("SELECT groupJid, jid, lid FROM autokick")
			.all() as Array<{
			groupJid: string;
			jid: string | null;
			lid: string | null;
		}>;
	},
};
