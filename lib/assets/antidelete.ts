import { CommandModule } from "@types";
import { AntiDelDb } from "lib";

export default {
	pattern: "antidelete",
	fromMe: true,
	isGroup: false,
	desc: "Recover deleted messages",
	type: "misc",
	handler: async (msg, match) => {
		if (!match) {
			return msg.send(["Usage:", `antidelete on`, `antidelete off`].join("\n"));
		}

		const cmd = match.trim().toLowerCase();

		if (cmd === "on")
			return AntiDelDb.set(true)
				? msg.send("Antidelete enabled.")
				: msg.send("Antidelete is already enabled.");

		if (cmd === "off")
			return AntiDelDb.set(false)
				? msg.send("Antidelete disabled.")
				: msg.send("Antidelete is already disabled.");

		return msg.send(["Usage:", `antidelete on`, `antidelete off`].join("\n"));
	},
} satisfies CommandModule;
