import config from "../../config";
import { commandMap, fancy } from "../utils";
import { CommandModule } from "@types";

export default {
	pattern: "menu",
	aliases: ["help", "commands"],
	desc: "Show all available commands organized by category",
	dontAddCommandList: true,
	handler: async msg => {
		const categories = new Map<string, string[]>();

		for (const [key, cmd] of commandMap) {
			if (key.startsWith("__event_") || cmd.dontAddCommandList) continue;

			const category = cmd.type || "unknown";
			const aliases = cmd.aliases || [];
			const commandDisplay =
				aliases.length > 0
					? `${cmd.pattern} , ${aliases.join(" , ")}`
					: cmd.pattern;

			if (!categories.has(category)) {
				categories.set(category, []);
			}

			const existing = categories.get(category)!;
			if (!existing.some(item => item.includes(cmd.pattern!))) {
				existing.push(commandDisplay);
			}
		}

		let menu = "" + fancy(`*${config.BOT_NAME ?? "Xstro"} Commands*`) + "\n\n";

		for (const [category, commands] of categories) {
			menu += fancy(`*${category}*\n`);
			commands.forEach((cmd, index) => {
				menu += fancy(`${index + 1}. ${cmd}\n`);
			});
			menu += "\n";
		}

		return msg.send(menu.trim());
	},
} satisfies CommandModule;
