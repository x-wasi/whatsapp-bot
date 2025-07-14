import { sqlite } from "src";

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS automute (
    jid TEXT PRIMARY KEY,
    startTime TEXT,
    endTime TEXT
  )
`);

export default {
	set: (jid: string, startTime: string, endTime?: string) => {
		const existing = sqlite
			.query("SELECT 1 FROM automute WHERE jid = ?")
			.get(jid);

		if (existing) {
			sqlite.run("UPDATE automute SET startTime = ?, endTime = ? WHERE jid = ?", [
				startTime,
				endTime ?? null,
				jid,
			]);
		} else {
			sqlite.run(
				"INSERT INTO automute (jid, startTime, endTime) VALUES (?, ?, ?)",
				[jid, startTime, endTime ?? null]
			);
		}

		return true;
	},

	remove: (jid: string) => {
		sqlite.run("DELETE FROM automute WHERE jid = ?", [jid]);
		const result = sqlite.query("SELECT changes() AS changes").get();
		if (result && typeof result === "object" && "changes" in result) {
			return (result as { changes: number }).changes;
		}
		return 0;
	},

	get: (jid: string) => {
		const result = sqlite
			.query("SELECT jid, startTime, endTime FROM automute WHERE jid = ?")
			.get(jid) as {
			jid: string;
			startTime: string | null;
			endTime: string | null;
		} | null;
		return result ?? null;
	},

	list: () => {
		return sqlite
			.query("SELECT jid, startTime, endTime FROM automute")
			.all() as Array<{
			jid: string;
			startTime: string;
			endTime: string | null;
		}>;
	},
};
