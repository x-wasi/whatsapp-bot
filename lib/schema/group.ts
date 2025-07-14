import { sqlite } from "src";

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS group_event (
    groupJid TEXT PRIMARY KEY,
    mode INTEGER
  )
`);

export default {
	set: (groupJid: string, enabled: boolean) => {
		const mode = enabled ? 1 : 0;
		const exists = sqlite
			.query("SELECT 1 FROM group_event WHERE groupJid = ?")
			.get(groupJid);

		if (exists) {
			sqlite.run("UPDATE group_event SET mode = ? WHERE groupJid = ?", [
				mode,
				groupJid,
			]);
		} else {
			sqlite.run("INSERT INTO group_event (groupJid, mode) VALUES (?, ?)", [
				groupJid,
				mode,
			]);
		}

		return { groupJid, enabled };
	},

	get: (groupJid: string) => {
		const result = sqlite
			.query("SELECT mode FROM group_event WHERE groupJid = ?")
			.get(groupJid) as { mode: number } | null;

		return result ? Boolean(result.mode) : false;
	},

	remove: (groupJid: string) => {
		const result = sqlite.run("DELETE FROM group_event WHERE groupJid = ?", [
			groupJid,
		]);
		return { success: result.changes > 0, groupJid };
	},

	list: (enabled?: boolean) => {
		let query = "SELECT groupJid, mode FROM group_event";
		const params = [];

		if (enabled !== undefined) {
			query += " WHERE mode = ?";
			params.push(enabled ? 1 : 0);
		}

		return sqlite
			.query(query)
			.all(params as any)
			.map((row: { groupJid: string; mode: number }) => ({
				groupJid: row.groupJid,
				enabled: Boolean(row.mode),
			}));
	},

	toggle: (groupJid: string) => {
		const current = sqlite
			.query("SELECT mode FROM group_event WHERE groupJid = ?")
			.get(groupJid) as { mode: number };

		if (!current) {
			sqlite.run("INSERT INTO group_event (groupJid, mode) VALUES (?, ?)", [
				groupJid,
				1,
			]);
			return { groupJid, enabled: true };
		}

		const newMode = current.mode ? 0 : 1;
		sqlite.run("UPDATE group_event SET mode = ? WHERE groupJid = ?", [
			newMode,
			groupJid,
		]);

		return { groupJid, enabled: Boolean(newMode) };
	},
};
