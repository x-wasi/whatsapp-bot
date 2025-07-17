import { CommandModule } from "@types";
import { en } from "lib/resources";

export default {
	pattern: "edit",
	fromMe: true,
	isGroup: false,
	desc: "Edit your own message",
	type: "whatsapp",
	handler: async (message, args) => {
		const msg = message.quoted;
		if (!msg || !msg?.key.fromMe)
			return message.send(en.plugin.edit.not_own_message);
		if (!args) return message.send(`Usage: edit Hello.`);
		return await message.edit(args);
	},
} satisfies CommandModule;
