import { sqlite } from "src";

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS autobio (
    status INTEGER
  )
`);

export default {
	set: (status: 1 | 0) => {
		const exists = sqlite.query("SELECT 1 FROM autobio").get();

		if (exists) {
			sqlite.run("UPDATE autobio SET status = ?", [status]);
		} else {
			sqlite.run("INSERT INTO autobio (status) VALUES (?)", [status]);
		}

		return true;
	},

	get: () => {
		const result = sqlite.query("SELECT status FROM autobio").get() as {
			status: 1 | 0;
		} | null;

		return !!result?.status;
	},

	del: () => {
		sqlite.run("DELETE FROM autobio");
		const result = sqlite.query("SELECT changes() AS changes").get();
		if (result && typeof result === "object" && "changes" in result) {
			return (result as { changes: number }).changes;
		}
		return 0;
	},
};
