import { CommandModule } from "@types";

export default {
	pattern: "search",
	fromMe: false,
	isGroup: false,
	desc: "Make Web Search",
	type: "misc",
	handler: async (msg, args) => {
		if (!args) return msg.send("_Provide Search Query_");
		const res = await fetch(
			`https://search.brave.com/search?q=${encodeURIComponent(args)}`
		);
		const html = await res.text();

		const matches = [
			...html.matchAll(
				/<a href="([^"]+)"[^>]*?class="[^"]*?heading-serpresult[^"]*?".*?<div class="title[^"]*?"[^>]*?title="([^"]+)">/gs
			),
		];

		return msg.send(
			matches
				.slice(0, 10)
				.map(([, url, title]) => `${title}\n${url}`)
				.join("\n\n")
		);
	},
} satisfies CommandModule;
