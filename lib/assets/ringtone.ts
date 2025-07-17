import type { CommandModule } from "@types";

export default {
	pattern: "ringtone",
	aliases: ["rt"],
	fromMe: false,
	isGroup: false,
	desc: "Download ringtones by query",
	type: "download",

	handler: async (msg, args) => {
		const query = args?.trim() ?? msg?.quoted?.text?.trim() ?? "";

		if (!query) {
			return msg.send("Provide a search query for the ringtone!");
		}

		const res = await fetch(
			`https://bk9.fun/download/RingTone?q=${encodeURIComponent(query)}`,
			{
				method: "GET",
				headers: {
					accept: "application/json",
					"user-agent": "TelegramBot (like TwitterBot)",
				},
			}
		);

		const data = await res.json();

		if (!data.status || !data.BK9?.length) {
			return msg.send("❌ Failed to fetch ringtones.");
		}

		for (const item of data.BK9) {
			await msg.send(item.audio);
		}
	},
} satisfies CommandModule;
