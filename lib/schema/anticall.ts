import { sqlite } from "src";

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS anticall (
    mode INTEGER,
    action TEXT NOT NULL
  )
`);

export default {
	get: () => {
		const record = sqlite
			.query("SELECT mode, action FROM anticall LIMIT 1")
			.get() as { mode: number | null; action: string } | null;
		if (record) {
			return {
				mode: record.mode != null ? Boolean(record.mode) : null,
				action: record.action as "block" | "warn",
			};
		}
		return null;
	},

	set: function (mode: boolean, action: "block" | "warn") {
		const current = this.get();
		if (current && current.mode === mode && current.action === action) {
			return false;
		}
		sqlite.run("DELETE FROM anticall");
		sqlite.run("INSERT INTO anticall (mode, action) VALUES (?, ?)", [
			mode ? 1 : 0,
			action,
		]);
		return true;
	},

	remove: () => {
		sqlite.run("DELETE FROM anticall");
		const result = sqlite.query("SELECT changes() AS changes").get();
		return result && typeof result === "object" && "changes" in result
			? (result as { changes: number }).changes
			: 0;
	},
};
