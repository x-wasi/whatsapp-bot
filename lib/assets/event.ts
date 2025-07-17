import { CommandModule } from "@types";
import { GroupDb } from "lib";

export default {
	pattern: "event",
	aliases: ["events"],
	fromMe: true,
	isGroup: true,
	desc: "Enable or disable group event mode",
	type: "group",
	handler: async (msg, args) => {
		const groupJid = msg.chat;

		if (!args) {
			const state = GroupDb.get(groupJid) ? "on" : "off";
			return msg.send(`Group events set: ${state}`);
		}

		const mode = args.toLowerCase();
		if (mode === "on") {
			GroupDb.set(groupJid, true);
			return msg.send("_Group event mode enabled_");
		}

		if (mode === "off") {
			GroupDb.remove(groupJid);
			return msg.send("_Group event mode disabled_");
		}

		return msg.send("_Usage: event <on|off>_");
	},
} satisfies CommandModule;
