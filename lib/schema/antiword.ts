import { sqlite } from "src";

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS antiword (
    jid TEXT PRIMARY KEY,
    status INTEGER,
    words TEXT
  )
`);

export default {
	set: (jid: string, status: boolean, words: string[]) => {
		const badWords = Array.from(new Set(words));
		const mode = status ? 1 : 0;
		const existing = sqlite
			.query("SELECT 1 FROM antiword WHERE jid = ?")
			.get(jid);

		if (existing) {
			sqlite.run("UPDATE antiword SET status = ?, words = ? WHERE jid = ?", [
				mode,
				JSON.stringify(badWords),
				jid,
			]);
		} else {
			sqlite.run("INSERT INTO antiword (jid, status, words) VALUES (?, ?, ?)", [
				jid,
				mode,
				JSON.stringify(badWords),
			]);
		}

		return { enabled: true, words: badWords.length };
	},

	remove: (jid: string) => {
		sqlite.run("DELETE FROM antiword WHERE jid = ?", [jid]);
		const result = sqlite.query("SELECT changes() AS changes").get() as {
			changes: number;
		};
		return result.changes > 0;
	},

	get: (jid: string) => {
		const record = sqlite
			.query("SELECT jid, status, words FROM antiword WHERE jid = ?")
			.get(jid) as {
			jid: string;
			status: number | null;
			words: string | null;
		} | null;

		if (!record) return null;

		return {
			jid: record.jid,
			status: record.status != null ? Boolean(record.status) : null,
			words: record.words ? JSON.parse(record.words) : [],
		};
	},
};
