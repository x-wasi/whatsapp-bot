import { sqlite } from "src";

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS antilink (
    jid TEXT NOT NULL UNIQUE,
    mode INTEGER,
    links TEXT
  )
`);

export default {
	set: (jid: string, mode: boolean, links?: string[]) => {
		const existing = sqlite
			.query("SELECT 1 FROM antilink WHERE jid = ?")
			.get(jid);

		const linksValue = links ? JSON.stringify(links) : null;

		if (existing) {
			sqlite.run("UPDATE antilink SET mode = ?, links = ? WHERE jid = ?", [
				mode ? 1 : 0,
				linksValue,
				jid,
			]);
		} else {
			sqlite.run("INSERT INTO antilink (jid, mode, links) VALUES (?, ?, ?)", [
				jid,
				mode ? 1 : 0,
				linksValue,
			]);
		}
	},

	get: (jid: string) => {
		const record = sqlite
			.query("SELECT jid, mode, links FROM antilink WHERE jid = ?")
			.get(jid) as {
			jid: string;
			mode: number | null;
			links: string | null;
		} | null;

		if (!record) return null;

		return {
			jid: record.jid,
			mode: record.mode != null ? Boolean(record.mode) : null,
			links: record.links ? JSON.parse(record.links) : [],
		};
	},

	remove: (jid: string) => {
		sqlite.run("DELETE FROM antilink WHERE jid = ?", [jid]);
	},

	isActive: (jid: string) => {
		const record = sqlite
			.query("SELECT mode FROM antilink WHERE jid = ?")
			.get(jid) as { mode: number } | null;

		return record ? Boolean(record.mode) : false;
	},
};
