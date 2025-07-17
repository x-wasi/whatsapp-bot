import { CommandModule } from "@types";
import { Greetings } from "lib";

export default {
	pattern: "welcome",
	fromMe: true,
	isGroup: true,
	desc: "Set, get, or remove welcome message",
	type: "group",
	handler: async (msg, args) => {
		const groupJid = msg.chat;

		if (!args) {
			const current = Greetings.welcome.get(groupJid);
			const state = current ? "ON" : "OFF";
			const text = current || "_No welcome message set._";
			return msg.send(`_Welcome is ${state.toLowerCase()}_\n\n${text}`);
		}

		if (args.toLowerCase().trim() === "off") {
			Greetings.welcome.del(groupJid);
			return msg.send("_Welcome message removed._");
		}

		if (args.toLowerCase().trim() === "on") {
			return msg.send("```Provide the welcome message after on.```");
		}

		Greetings.welcome.set(groupJid, args);
		return msg.send("_Welcome message set._");
	},
} satisfies CommandModule;
