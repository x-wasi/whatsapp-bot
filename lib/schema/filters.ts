import { sqlite } from "src";

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS filters (
    name TEXT NOT NULL UNIQUE,
    response TEXT,
    status INTEGER DEFAULT 0,
    isGroup INTEGER
  )
`);

function transformRecord(record: any) {
	return {
		name: record.name,
		response: record.response || null,
		status: Boolean(record.status),
		isGroup: record.isGroup != null ? Boolean(record.isGroup) : null,
	};
}

export default {
	set: (name: string, response: string, status: boolean, isGroup = false) => {
		const normalizedName = name.trim().toLowerCase();
		const params = {
			response,
			status: status ? 1 : 0,
			isGroup: isGroup ? 1 : 0,
		};

		const exists = sqlite
			.query("SELECT 1 FROM filters WHERE name = ?")
			.get(normalizedName);

		if (exists) {
			sqlite.run(
				"UPDATE filters SET response = ?, status = ?, isGroup = ? WHERE name = ?",
				[params.response, params.status, params.isGroup, normalizedName]
			);
		} else {
			sqlite.run(
				"INSERT INTO filters (name, response, status, isGroup) VALUES (?, ?, ?, ?)",
				[normalizedName, params.response, params.status, params.isGroup]
			);
		}

		return { name: normalizedName, ...params };
	},

	get: (name: string) => {
		const normalizedName = name.trim().toLowerCase();
		const record = sqlite
			.query("SELECT * FROM filters WHERE name = ?")
			.get(normalizedName);

		return record ? transformRecord(record) : null;
	},

	getAll: () => {
		const records = sqlite.query("SELECT * FROM filters WHERE status = 1").all();

		return records.map(transformRecord);
	},

	getActive: (isGroup?: boolean) => {
		let query = "SELECT * FROM filters WHERE status = 1";
		const params = [];

		if (isGroup !== undefined) {
			query += " AND isGroup = ?";
			params.push(isGroup ? 1 : 0);
		}

		return sqlite
			.query(query)
			.all(params as any)
			.map(transformRecord);
	},

	remove: (name: string) => {
		const normalizedName = name.trim().toLowerCase();
		const result = sqlite.run("DELETE FROM filters WHERE name = ?", [
			normalizedName,
		]);
		return { success: result.changes > 0, name: normalizedName };
	},

	toggle: (name: string, status?: boolean) => {
		const normalizedName = name.trim().toLowerCase();
		const current = sqlite
			.query("SELECT status FROM filters WHERE name = ?")
			.get(normalizedName) as { status: any };

		if (!current) return null;

		const newStatus = status !== undefined ? status : !Boolean(current.status);
		sqlite.run("UPDATE filters SET status = ? WHERE name = ?", [
			newStatus ? 1 : 0,
			normalizedName,
		]);

		return { name: normalizedName, status: newStatus };
	},
};
