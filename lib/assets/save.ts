import { CommandModule } from "@types";
import { en } from "lib/resources";

export default {
	pattern: "save",
	fromMe: true,
	isGroup: false,
	desc: "Save any message to your owner",
	type: "whatsapp",
	handler: async msg => {
		const quoted = msg.quoted;
		if (!quoted) return msg.send(en.reply_msg);
		await msg.forward(msg.owner.jid, quoted, { quoted: msg });
		return msg.send(en.plugin.forward.success);
	},
} satisfies CommandModule;
