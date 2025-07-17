import { CommandModule } from "@types";
import { sleep } from "bun";
import { en } from "lib/resources";

export default [
	{
		pattern: "block",
		fromMe: true,
		isGroup: false,
		desc: "Block a user from Messaging you",
		type: "whatsapp",
		handler: async (msg, args) => {
			const jid = await msg.user(args);
			if (!jid) return msg.send(en.warn.invaild_user);
			await msg.send(en.plugin.block.blocked);
			await sleep(300);
			return msg.updateBlockStatus(jid.id, "block");
		},
	},
	{
		pattern: "unblock",
		fromMe: true,
		isGroup: false,
		desc: "Unblock a user to allow Messaging",
		type: "whatsapp",
		handler: async (msg, args) => {
			const jid = await msg.user(args);
			if (!jid) return msg.send(en.warn.invaild_user);
			await msg.updateBlockStatus(jid.id, "unblock");
			return await msg.send(en.plugin.block.unblocked);
		},
	},
] satisfies CommandModule[];
