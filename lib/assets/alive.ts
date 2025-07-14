import { formatRuntime, AliveDb, getFact, getQuote } from "lib";
import { CommandModule } from "@types";

export default {
	pattern: "alive",
	fromMe: false,
	isGroup: false,
	desc: "Get Alive message",
	type: "misc",
	handler: (msg, match) => {
		if (match) AliveDb.set(match);

		const aliveMsg = AliveDb.get()
			.replace("@user", `@${msg.sender.split("@")[0]}`)
			.replace("@owner", `@${msg.owner.jid.split("@")[0]}`)
			.replace("@facts", getFact())
			.replace("@uptime", formatRuntime(process.uptime()))
			.replace("@quotes", getQuote());

		return msg.send(aliveMsg, {
			to: msg.chat,
			mentions: [msg.owner.jid, msg.sender].filter(Boolean),
		});
	},
} satisfies CommandModule;
