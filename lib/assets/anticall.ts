import { CommandModule } from "@types";
import { AntiCallDb } from "lib";

export default {
	pattern: "anticall",
	fromMe: true,
	isGroup: false,
	desc: "Setup Anticall",
	type: "misc",
	handler: async (msg, args) => {
		const input = args?.toLowerCase()?.trim();

		if (!input || !["on", "off", "block", "warn"].includes(input))
			return msg.send(`Usage: anticall on | off | block | warn`);

		const current = AntiCallDb.get();

		if (input === "off") {
			if (!current || (current.mode === false && current.action === "warn"))
				return msg.send("AntiCall is already turned off.");

			AntiCallDb.set(false, "warn");
			return msg.send("AntiCall has been turned off.");
		}

		if (input === "on") {
			if (current?.mode === true && current.action === "warn")
				return msg.send("AntiCall is already on with warn action.");

			AntiCallDb.set(true, "warn");
			return msg.send("AntiCall has been turned on and set to warn caller.");
		}

		if (["block", "warn"].includes(input)) {
			if (current?.mode === true && current.action === input)
				return msg.send(`AntiCall is already set to '${input}'.`);

			AntiCallDb.set(true, input as "block" | "warn");
			return msg.send(`AntiCall action set to '${input}'_`);
		}
	},
} satisfies CommandModule;
