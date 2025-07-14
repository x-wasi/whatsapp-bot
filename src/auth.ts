import { sqlite } from "./sqlite";
import { Red } from "lib";
import { BufferJSON, initAuthCreds, WAProto } from "baileys";
import type { AuthenticationCreds, SignalDataTypeMap } from "baileys";

sqlite.exec(`
	CREATE TABLE IF NOT EXISTS auth (
	name TEXT PRIMARY KEY,
	data TEXT
	);
`);

export default () => {
	function writeData(data: any, name: string) {
		const exists = sqlite.query("SELECT 1 FROM auth WHERE name = ?").get(name);
		const serializedData = JSON.stringify(data, BufferJSON.replacer);

		if (exists) {
			sqlite.run("UPDATE auth SET data = ? WHERE name = ?", [
				serializedData,
				name,
			]);
		} else {
			sqlite.run("INSERT INTO auth (name, data) VALUES (?, ?)", [
				name,
				serializedData,
			]);
		}
	}

	function readData(name: string) {
		const exists = sqlite
			.query("SELECT data FROM auth WHERE name = ?")
			.get(name) as {
			name: string;
			data: string | null;
		} | null;
		try {
			return exists?.data ? JSON.parse(exists.data, BufferJSON.reviver) : null;
		} catch {
			return null;
		}
	}

	async function removeData(name: string): Promise<void> {
		sqlite.run("DELETE FROM auth WHERE name = ?", [name]);
	}

	const creds: AuthenticationCreds = readData("creds") || initAuthCreds();

	return {
		state: {
			creds,
			keys: {
				get: async <T extends keyof SignalDataTypeMap>(
					type: T,
					ids: string[]
				): Promise<{ [id: string]: SignalDataTypeMap[T] }> => {
					const data: { [id: string]: SignalDataTypeMap[T] } = {};
					await Promise.all(
						ids.map(async id => {
							let value = await readData(`${type}-${id}`);
							if (type === "app-state-sync-key" && value) {
								try {
									value = WAProto.Message.AppStateSyncKeyData.fromObject(value);
								} catch (e) {
									Red(`Failed to decode AppStateSyncKeyData for ID "${id}":`, e);
								}
							}
							data[id] = value as SignalDataTypeMap[T];
						})
					);
					return data;
				},
				set: async (data: { [category: string]: { [id: string]: any } }) => {
					const tasks = Object.entries(data).flatMap(([category, ids]) =>
						Object.entries(ids).map(([id, value]) =>
							value
								? writeData(value, `${category}-${id}`)
								: removeData(`${category}-${id}`)
						)
					);
					await Promise.all(tasks);
				},
			},
		},
		saveCreds: async () => {
			writeData(creds, "creds");
		},
	};
};
