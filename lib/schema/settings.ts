import { sqlite } from "src";

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY,
    prefix TEXT NOT NULL DEFAULT '["."]',
    mode INTEGER NOT NULL DEFAULT 1,
    autoLikeStatus INTEGER NOT NULL DEFAULT 0
  )
`);

function transformRecord(record: any) {
	return {
		prefix: JSON.parse(record.prefix),
		mode: Boolean(record.mode),
		autoLikeStatus: Boolean(record.autoLikeStatus),
	};
}

export default {
	prefix: {
		set: (payload: string[]) => {
			const { prefix, mode, autoLikeStatus } = transformRecord(
				sqlite
					.query("SELECT prefix, mode, autoLikeStatus FROM settings WHERE id = ?")
					.get(1)
			);
			const updated = Array.from(new Set([...prefix, ...payload]));
			sqlite.run(
				"UPDATE settings SET prefix = ?, mode = ?, autoLikeStatus = ? WHERE id = ?",
				[JSON.stringify(updated), mode ? 1 : 0, autoLikeStatus ? 1 : 0, 1]
			);
			return { prefix: updated, mode, autoLikeStatus };
		},

		get: () => {
			const config = sqlite
				.query("SELECT prefix FROM settings WHERE id = ?")
				.get(1) as { prefix: string };
			return config ? JSON.parse(config.prefix) : ["."];
		},

		del: () => {
			const { mode, autoLikeStatus } = transformRecord(
				sqlite
					.query("SELECT prefix, mode, autoLikeStatus FROM settings WHERE id = ?")
					.get(1)
			);
			const defaultPrefix = ["."];
			sqlite.run(
				"UPDATE settings SET prefix = ?, mode = ?, autoLikeStatus = ? WHERE id = ?",
				[JSON.stringify(defaultPrefix), mode ? 1 : 0, autoLikeStatus ? 1 : 0, 1]
			);
			return { prefix: defaultPrefix, mode, autoLikeStatus };
		},
	},

	mode: {
		set: (mode: boolean) => {
			const { prefix, autoLikeStatus } = transformRecord(
				sqlite
					.query("SELECT prefix, mode, autoLikeStatus FROM settings WHERE id = ?")
					.get(1)
			);
			sqlite.run(
				"UPDATE settings SET mode = ?, prefix = ?, autoLikeStatus = ? WHERE id = ?",
				[mode ? 1 : 0, JSON.stringify(prefix), autoLikeStatus ? 1 : 0, 1]
			);
			return { prefix, mode, autoLikeStatus };
		},

		get: () => {
			const config = sqlite
				.query("SELECT mode FROM settings WHERE id = ?")
				.get(1) as { mode: number };
			return config ? Boolean(config.mode) : true;
		},

		del: () => {
			const { prefix, autoLikeStatus } = transformRecord(
				sqlite
					.query("SELECT prefix, mode, autoLikeStatus FROM settings WHERE id = ?")
					.get(1)
			);
			const defaultMode = true;
			sqlite.run(
				"UPDATE settings SET mode = ?, prefix = ?, autoLikeStatus = ? WHERE id = ?",
				[defaultMode ? 1 : 0, JSON.stringify(prefix), autoLikeStatus ? 1 : 0, 1]
			);
			return { prefix, mode: defaultMode, autoLikeStatus };
		},
	},

	autoLikeStatus: {
		set: (status: boolean) => {
			const { prefix, mode } = transformRecord(
				sqlite
					.query("SELECT prefix, mode, autoLikeStatus FROM settings WHERE id = ?")
					.get(1)
			);
			sqlite.run(
				"UPDATE settings SET prefix = ?, mode = ?, autoLikeStatus = ? WHERE id = ?",
				[JSON.stringify(prefix), mode ? 1 : 0, status ? 1 : 0, 1]
			);
			return { prefix, mode, autoLikeStatus: status };
		},

		get: () => {
			const config = sqlite
				.query("SELECT autoLikeStatus FROM settings WHERE id = ?")
				.get(1) as { autoLikeStatus: number };
			return config ? Boolean(config.autoLikeStatus) : false;
		},

		del: () => {
			const { prefix, mode } = transformRecord(
				sqlite
					.query("SELECT prefix, mode, autoLikeStatus FROM settings WHERE id = ?")
					.get(1)
			);
			const defaultAutoLikeStatus = false;
			sqlite.run(
				"UPDATE settings SET prefix = ?, mode = ?, autoLikeStatus = ? WHERE id = ?",
				[JSON.stringify(prefix), mode ? 1 : 0, defaultAutoLikeStatus ? 1 : 0, 1]
			);
			return { prefix, mode, autoLikeStatus: defaultAutoLikeStatus };
		},
	},

	get: () => {
		let config = sqlite
			.query("SELECT prefix, mode, autoLikeStatus FROM settings WHERE id = ?")
			.get(1);

		if (!config) {
			sqlite.run(
				"INSERT INTO settings (id, prefix, mode, autoLikeStatus) VALUES (?, ?, ?, ?)",
				[1, JSON.stringify(["."]), 1, 0]
			);
			config = sqlite
				.query("SELECT prefix, mode, autoLikeStatus FROM settings WHERE id = ?")
				.get(1);
		}

		return transformRecord(config);
	},
};
