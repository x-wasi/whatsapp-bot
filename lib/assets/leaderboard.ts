import { CommandModule } from "@types";
import { getLeaderboard } from "lib";

export default {
	pattern: "leaderboard",
	desc: "View the game leaderboard",
	type: "games",
	fromMe: false,
	isGroup: false,
	handler: async msg => {
		const lbEntries = await getLeaderboard();
		if (!lbEntries?.length) return msg.send("No leaderboard data available.");

		const ranks = [
			"legend",
			"master",
			"diamond",
			"platinum",
			"gold",
			"silver",
			"bronze",
		];
		lbEntries.sort((a, b) => {
			const r = ranks.indexOf(a.rank) - ranks.indexOf(b.rank);
			return r !== 0 ? r : b.score - a.score;
		});

		let text = "LeaderBoard\n\n";
		for (const rank of ranks) {
			const group = lbEntries.filter(e => e.rank === rank);
			text += group.length
				? `${rank[0].toUpperCase() + rank.slice(1)}:\n${group
						.map((e, i) => `${i + 1}. @${e.userId.split("@")[0]}: ${e.score}`)
						.join("\n")}\n`
				: `${rank[0].toUpperCase() + rank.slice(1)}:\n---\n`;
		}

		return msg.send("```" + text.trim() + "```", {
			mentions: lbEntries.map(e => e.userId),
			to: msg.chat,
		});
	},
} satisfies CommandModule;
