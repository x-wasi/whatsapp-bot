import { CommandModule } from "@types";
import { Settings } from "lib";

export default [
	{
		pattern: "autostatus",
		fromMe: true,
		isGroup: false,
		desc: "Make bot auto like status",
		type: 'misc',
		handler: async (msg, match) => {
			const option = match?.trim()?.toLowerCase();
			if (option !== "on" && option !== "off") {
				return msg.send("_Please specify 'on' or 'off'._");
			}

			const current = Settings.autoLikeStatus.get();
			const desired = option === "on";

			if (current === desired) {
				return msg.send(`_Auto-like status is already ${option}_`);
			}

			Settings.autoLikeStatus.set(desired);
			return msg.send(`_Auto-like status is now ${option}_`);
		},
	},
	{
		on: true,
		dontAddCommandList: true,
		handler: async msg => {
			if (msg.broadcast && Settings.autoLikeStatus.get()) {
				const emojis = ["💚", "❤️", "💖", "💜", "💙", "🧡", "💛", "🤍"];
				const emoji = emojis[Math.floor(Math.random() * emojis.length)];

				return await msg.sendMessage(
					msg.chat,
					{ react: { text: emoji, key: msg.key } },
					{ statusJidList: [msg.sender, msg.owner?.jid] }
				);
			}
		},
	},
] satisfies CommandModule[];
