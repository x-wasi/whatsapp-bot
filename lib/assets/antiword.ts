import { CommandModule } from "@types";
import { AntiWordDb } from "lib/schema";

export default [
	{
		pattern: "antiword",
		fromMe: false,
		isGroup: true,
		type: "group",
		handler: async (message, match) => {
			const jid = message.chat;
			const prefix = message.prefix[0];

			if (!match) {
				return message.send(`Usage:
${prefix}antiword on/off — Enable/Disable the filter
${prefix}antiword get — Show blocked words
${prefix}antiword set word1, word2 — Set blocked words`);
			}

			const [cmd, ...rest] = match.trim().split(" ");
			const lcCmd = cmd?.toLowerCase();

			if (lcCmd === "on" || lcCmd === "off") {
				AntiWordDb.set(jid, lcCmd === "on", []);
				return message.send(
					`_Antiword filter has been ${lcCmd === "on" ? "enabled" : "disabled"}._`
				);
			}

			if (lcCmd === "get") {
				const { words = [] } = AntiWordDb.get(jid) || {};
				return message.send(
					words?.length
						? `📛 Blocked words (${words.length}):\n${words.join(", ")}`
						: "_No blocked words are set._"
				);
			}

			if (lcCmd === "set") {
				const words = rest
					.join(" ")
					.split(",")
					.map(w => w.trim())
					.filter(Boolean);
				if (!words.length) return message.send("_No valid words detected._");
				AntiWordDb.set(jid, true, words);
				return message.send(
					`_Antiword list updated with ${words.length} word(s)._`
				);
			}

			return message.send('❓ Invalid command. Use "on", "off", "get", or "set".');
		},
	},
	{
		on: true,
		dontAddCommandList: true,
		handler: async msg => {
			if (!msg.isGroup || !msg?.text) return;
			if (msg.key.fromMe) return;
			if (msg.isAdmin || !msg.isBotAdmin) return;

			const record = AntiWordDb.get(msg.chat);
			if (!record?.status || !record.words?.length) return;

			const lowerText = msg.text.toLowerCase();
			const matched = record.words.find((word: string) => {
				return new RegExp(`\\b${escapeRegex(word)}\\b`, "i").test(lowerText);
			});

			if (matched) {
				await msg.delete(msg);
				await msg.send(`_🚫 The word "${matched}" is not allowed here._`);
			}
		},
	},
] satisfies CommandModule[];

export function escapeRegex(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
