import { isJidGroup } from "baileys";
import { Green, StoreDb, serialize, execute, Serialize, AntiDelDb } from "lib";
import { forwardM } from "lib/utils/sock";
import type { BaileysEventMap, WASocket } from "baileys";

export async function messagesUpsert(
	sock: WASocket,
	event: BaileysEventMap["messages.upsert"]
) {
	for (const message of event.messages) {
		if (!message || typeof message !== "object") continue;

		const msg = await serialize(sock, message);
		const protocol = msg?.message?.protocolMessage;

		if (protocol?.type === 0) {
			sock.ev.emit("messages.delete", {
				keys: [{ ...protocol.key }],
			});
		}

		await Promise.allSettled([_callCommands(msg), StoreDb.save(event)]);
	}
}

export async function messagesDelete(
	sock: WASocket,
	event: BaileysEventMap["messages.delete"]
) {
	if (AntiDelDb.get()) {
		if ("keys" in event) {
			const keys = event.keys;

			for (const key of keys) {
				const msg = StoreDb.load(key);

				if (msg && !msg.key.fromMe) {
					const jid = String(
						isJidGroup(msg.key.remoteJid!) ? msg.key.remoteJid : sock.user?.id
					);

					return await forwardM(sock, jid, msg, { quoted: msg });
				}
			}
		}
	}
}

function _callCommands(msg: Serialize) {
	// const prefix = getprefix();
	// if (!!prefix && /\S/.test(prefix)) {
	// 	if (!msg.text.startsWith(prefix)) return;
	// }

	return execute(msg);
}
