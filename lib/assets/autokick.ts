import { CommandModule } from "@types";
import { isJidUser, isLidUser } from "baileys";
import { en } from "lib/resources";
import { AutoKickDb } from "lib/schema";

export default {
	pattern: "autokick",
	fromMe: true,
	isGroup: true,
	desc: "Manage autokick list (add, del, list)",
	type: "group",
	handler: async (msg, args) => {
		if (!msg.isAdmin) return msg.send(en.sender_not_admin);
		if (!msg.isBotAdmin) return msg.send(en.bot_not_admin);
		if (!args) {
			return msg.send(`Usage: ${msg.prefix[0]}autokick <add|del|list> <user?>`);
		}

		const [subcmd, ...rest] = args.split(" ");
		const groupJid = msg.chat;

		if (subcmd === "list") {
			const allEntries = AutoKickDb.list();
			const entry = allEntries.find(e => e.groupJid === groupJid);

			if (!entry || (!entry.jid && !entry.lid)) {
				return msg.send("_No users in autokick list._");
			}

			const list = [entry.jid, entry.lid].filter(Boolean) as string[];
			const formatted = list.map(u => `@${u.split("@")[0]}`).join("\n");

			return msg.send(`Autokick list:\n${formatted}`, {
				mentions: list,
				to: msg.chat,
			});
		}

		const rawUser = rest.join(" ");
		const { id, jid, lid } = await msg.user(rawUser);
		if (!isJidUser(id) && !isLidUser(id)) return msg.send(en.warn.invaild_user);

		if (subcmd === "add") {
			const j = isJidUser(id) ? id : null;
			const l = isLidUser(id) ? (id as string) : null;
			AutoKickDb.set(groupJid, j, l);
			return msg.send(`_@${id.split("@")[0]} added to autokick list_`, {
				mentions: [id],
				to: msg.chat,
			});
		}

		if (subcmd === "del") {
			AutoKickDb.remove(groupJid);
			return msg.send(`_Autokick entry for group ${groupJid} removed_`);
		}

		return msg.send("_Use `add`, `del`, or `list`._");
	},
} satisfies CommandModule;
