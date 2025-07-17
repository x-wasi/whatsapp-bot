import { CommandModule } from "@types";

export default [
	{
		pattern: "restart",
		aliases: ["reboot"],
		fromMe: true,
		isGroup: false,
		desc: "Restart the bot",
		type: "system",
		handler: async msg => {
			await msg.send("Restarting...");
			process.exit(0);
		},
	},
	{
		pattern: "shutdown",
		fromMe: true,
		isGroup: false,
		desc: "Shutdown the bot",
		type: "system",
		handler: async msg => {
			await msg.send("Shutting down...");
			process.exit(1);
		},
	},
] satisfies CommandModule[];
