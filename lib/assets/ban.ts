import { CommandModule } from "@types";
import { en } from "lib/resources";
import { BanDb } from "lib/schema";

export default [
	{
		pattern: "ban",
		fromMe: true,
		isGroup: false,
		desc: "Ban a user from using the bot",
		type: "misc",
		handler: async (msg, args) => {
			const user = await msg.user(args);
			if (!user) return msg.send(en.warn.invaild_user);
			const { id, jid, lid } = user;

			if (BanDb.check(id)) return msg.send(en.plugin.ban.already);
			BanDb.add(jid, lid);
			return msg.send(en.plugin.ban.user_banned);
		},
	},
	{
		pattern: "unban",
		fromMe: true,
		isGroup: false,
		desc: "Unban a user",
		type: "misc",
		handler: async (msg, args) => {
			const user = await msg.user(args);
			if (!user) return msg.send(en.warn.invaild_user);

			const { id, jid } = user;
			if (!BanDb.check(id)) return msg.send(en.plugin.ban.not_banned);
			BanDb.remove(jid);
			return msg.send(en.plugin.ban.user_unbanned);
		},
	},
	{
		pattern: "getban",
		fromMe: true,
		isGroup: false,
		desc: "List banned users",
		type: "misc",
		handler: async msg => {
			const banned = BanDb.list("jid");
			if (!banned.length) return msg.send(en.plugin.ban.none);

			const users = banned.map(user => `@${user.split("@")[0]}`).join("\n");
			const mentions = banned.map(user => user);
			return msg.send(users, { mentions, to: msg.chat });
		},
	},
] satisfies CommandModule[];
