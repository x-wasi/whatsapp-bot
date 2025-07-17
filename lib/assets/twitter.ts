import type { CommandModule } from "@types";
import { extractUrlFromText } from "baileys";

export default {
	pattern: "twitter",
	aliases: ["x"],
	fromMe: false,
	isGroup: false,
	desc: "Download Twitter/X videos",
	type: "download",
	handler: async (msg, args) => {
		const url = extractUrlFromText(args ?? msg?.quoted?.text ?? "");
		if (
			!url ||
			!/^https?:\/\/(?:www\.)?(twitter\.com|x\.com)\/[^\/\s]+\/status\/\d+/i.test(
				url
			)
		) {
			return msg.send("Provide a valid Twitter/X link!");
		}

		const res = await fetch("https://xstroapi.vercel.app", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				accept: "application/json",
			},
			body: JSON.stringify({ url }),
		})
			.then(res => res.json())
			.then(res => res);

		return await msg.send(res.url);
	},
} satisfies CommandModule;
