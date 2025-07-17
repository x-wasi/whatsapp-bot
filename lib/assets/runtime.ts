import { CommandModule } from "@types";
import { formatRuntime } from "lib/utils";

export default {
	pattern: "runtime",
	aliases: ["uptime"],
	fromMe: false,
	isGroup: false,
	desc: "Get the bot's runtime",
	type: "system",
	handler: async msg => {
		return msg.send(formatRuntime(process.uptime()));
	},
} satisfies CommandModule;
