import { CommandModule } from "@types";
import { Settings } from "lib";

export default [
	{
		pattern: "setprefix",
		fromMe: true,
		isGroup: false,
		desc: "Set handler for bot",
		type: "misc",
		handler: async (msg, args) => {
			if (!args) return msg.send(`_Usage: setprefix *#,_`);
			Settings.prefix.set([...args.split("")]);
			return msg.send(`_Bot prefix updated to "${args}"_\nUsage: ${args[0]}ping`);
		},
	},
	{
		pattern: "mode",
		fromMe: true,
		isGroup: false,
		desc: "Set bot mode",
		type: "misc",
		handler: async (msg, match) => {
			const mode = match?.toLowerCase().trim();
			const current = Settings.mode.get();
			if (!["private", "public"].includes(mode!))
				return msg.send(`Usage:\nmode private\nmode public`);
			const updated = mode === "private";
			if (current === updated) return msg.send(`_Mode already in ${mode}_`);
			Settings.mode.set(updated);
			return msg.send(`_Bot is now in ${mode} mode_`);
		},
	},
] satisfies CommandModule[];
