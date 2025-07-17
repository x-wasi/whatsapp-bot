import { CommandModule } from "@types";
import { en } from "lib";

export default [
	{
		pattern: "forward",
		aliases: ["fd"],
		fromMe: true,
		isGroup: false,
		desc: "Forward a message to a user",
		type: "whatsapp",
		handler: async (message, match) => {
			const msg = message.quoted;
			if (!msg) return message.send(en.plugin.forward.no_message);
			const jid = await message.user(match);
			if (!jid.id) return message.send(en.plugin.forward.invalid_user);
			await message.forward(jid.id, msg);
			return message.send(en.plugin.forward.success);
		},
	},
	{
		pattern: "fullforward",
		aliases: ["fwd"],
		fromMe: true,
		isGroup: false,
		desc: "Forward a message with full details",
		type: "whatsapp",
		handler: async (message, match) => {
			const msg = message.quoted;
			if (!msg) return message.send(en.plugin.forward.no_message);
			const jid = await message.user(match);
			if (!jid.id) return message.send(en.plugin.forward.invalid_user);
			await message.forward(jid.id, msg, {
				quoted: msg,
				forwardingScore: 999,
				isForwarded: true,
			});
			return message.send(en.plugin.forward.success);
		},
	},
] satisfies CommandModule[];
