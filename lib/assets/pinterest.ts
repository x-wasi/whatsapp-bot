import type { CommandModule } from "@types";
import { extractUrlFromText } from "baileys";

export default {
	pattern: "pinterest",
	aliases: ["pint"],
	fromMe: false,
	isGroup: false,
	desc: "Download Pinterest media",
	type: "download",

	handler: async (msg, args) => {
		const url = extractUrlFromText(args ?? msg?.quoted?.text ?? "");

		if (
			!url ||
			!/^https?:\/\/(?:www\.|pin\.it\/|pinterest\.com\/|pinterest\.[a-z]+\/)(?:pin\/|[\w\d]+)\/?$/i.test(
				url
			)
		) {
			return msg.send("Provide a valid Pinterest link!");
		}

		const res = await fetch(
			`https://bk9.fun/download/pinterest?url=${encodeURIComponent(url)}`,
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
			return msg.send("❌ Failed to fetch media.");
		}

		for (const item of data.BK9) {
			await msg.send(item.url);
		}
	},
} satisfies CommandModule;
