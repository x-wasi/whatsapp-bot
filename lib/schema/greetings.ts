import { sqlite } from "src";

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS group_join (
    groupJid TEXT PRIMARY KEY,
    welcome TEXT,
    goodbye TEXT
  )
`);

function transformRecord(record: any) {
	return {
		groupJid: record.groupJid,
		welcome: record.welcome || null,
		goodbye: record.goodbye || null,
	};
}

export default {
	welcome: {
		set: (id: string, text: string) => {
			const normalizedId = id.trim();
			const params = { welcome: text };

			const exists = sqlite
				.query("SELECT 1 FROM group_join WHERE groupJid = ?")
				.get(normalizedId);

			if (exists) {
				sqlite.run("UPDATE group_join SET welcome = ? WHERE groupJid = ?", [
					params.welcome,
					normalizedId,
				]);
			} else {
				sqlite.run("INSERT INTO group_join (groupJid, welcome) VALUES (?, ?)", [
					normalizedId,
					params.welcome,
				]);
			}

			return { groupJid: normalizedId, welcome: params.welcome, goodbye: null };
		},

		get: (id: string) => {
			const normalizedId = id.trim();
			const record = sqlite
				.query("SELECT * FROM group_join WHERE groupJid = ?")
				.get(normalizedId);

			return record ? transformRecord(record).welcome : null;
		},

		del: (id: string) => {
			const normalizedId = id.trim();
			const result = sqlite.run(
				"UPDATE group_join SET welcome = NULL WHERE groupJid = ?",
				[normalizedId]
			);
			return { success: result.changes > 0, groupJid: normalizedId };
		},
	},

	goodbye: {
		set: (id: string, text: string) => {
			const normalizedId = id.trim();
			const params = { goodbye: text };

			const exists = sqlite
				.query("SELECT 1 FROM group_join WHERE groupJid = ?")
				.get(normalizedId);

			if (exists) {
				sqlite.run("UPDATE group_join SET goodbye = ? WHERE groupJid = ?", [
					params.goodbye,
					normalizedId,
				]);
			} else {
				sqlite.run("INSERT INTO group_join (groupJid, goodbye) VALUES (?, ?)", [
					normalizedId,
					params.goodbye,
				]);
			}

			return { groupJid: normalizedId, welcome: null, goodbye: params.goodbye };
		},

		get: (id: string) => {
			const normalizedId = id.trim();
			const record = sqlite
				.query("SELECT * FROM group_join WHERE groupJid = ?")
				.get(normalizedId);

			return record ? transformRecord(record).goodbye : null;
		},

		del: (id: string) => {
			const normalizedId = id.trim();
			const result = sqlite.run(
				"UPDATE group_join SET goodbye = NULL WHERE groupJid = ?",
				[normalizedId]
			);
			return { success: result.changes > 0, groupJid: normalizedId };
		},
	},
};
