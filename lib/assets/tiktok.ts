import type { CommandModule } from "@types";
import { extractUrlFromText } from "baileys";
import { getBuffer } from "lib/utils";

export default {
	pattern: "tiktok",
	aliases: ["tt"],
	fromMe: false,
	isGroup: false,
	desc: "Download TikTok videos",
	type: "download",

	handler: async (msg, args) => {
		console.log(args ?? msg?.quoted?.text ?? "");
		const url = extractUrlFromText(args ?? msg?.quoted?.text ?? "");

		console.log(url);

		if (
			!url ||
			!/^https?:\/\/(?:(?:www|vm|m|vt)\.)?tiktok\.com\/(?:@[^\/\s]+\/video\/\d+|[\w\d]+)\/?$/i.test(
				url
			)
		) {
			return msg.send("Provide a valid TikTok video link!");
		}

		const res = await fetch(
			`https://bk9.fun/download/tiktok?url=${encodeURIComponent(url)}`,
			{
				method: "GET",
			}
		);

		const data = await res.json();

		if (!data.status || !data.BK9?.BK9) {
			return msg.send("❌ Failed to fetch media.");
		}

		return msg.send(await getBuffer(data.BK9.BK9));
	},
} satisfies CommandModule;
