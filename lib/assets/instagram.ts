import type { CommandModule } from "@types";
import { extractUrlFromText } from "baileys";

export default {
	pattern: "instagram",
	aliases: ["ig", "insta"],
	fromMe: false,
	isGroup: false,
	desc: "Download Instagram videos",
	type: "download",

	handler: async (msg, args) => {
		const url = extractUrlFromText(args ?? msg?.quoted?.text ?? "");

		if (
			!url ||
			!/^https?:\/\/(?:www\.)?instagram\.com\/[^\/\s]+\/(reel|p|tv)\/[a-zA-Z0-9._%-]+\/?$/i.test(
				url
			)
		) {
			return msg.send("Provide a valid Instagram link!");
		}

		const res = await fetch(
			`https://bk9.fun/download/instagram?url=${encodeURIComponent(url)}`,
			{
				method: "GET",
			}
		);

		const data = await res.json();

		if (!data.status || !data.BK9?.[0]?.url) {
			return msg.send("❌ Failed to fetch media.");
		}

		return msg.send(data.BK9[0].url);
	},
} satisfies CommandModule;
