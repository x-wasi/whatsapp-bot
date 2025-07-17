import { Pool } from "pg";

const pool = new Pool({
	connectionString:
		"postgres://avnadmin:AVNS_DAiFNxk2X8X53ZcL89G@leaderboard-leaderboard-whatsappbot.e.aivencloud.com:17564/defaultdb",
	ssl: {
		rejectUnauthorized: false,
	},
	keepAlive: true,
});

async function PostgreDB() {
	await pool.query(`
	CREATE TABLE IF NOT EXISTS leaderboard (
		userid VARCHAR(255) PRIMARY KEY,
		score INTEGER NOT NULL,
		rank VARCHAR(50) NOT NULL DEFAULT 'bronze'
	)`);
}

PostgreDB().catch(console.error);

enum UserRank {
	LEGEND = 1,
	MASTER = 2,
	DIAMOND = 3,
	PLATINUM = 4,
	GOLD = 5,
	SILVER = 6,
	BRONZE = 7,
}

const SCORE_THRESHOLDS = {
	LEGEND: 7000,
	MASTER: 5400,
	DIAMOND: 3200,
	PLATINUM: 800,
	GOLD: 600,
	SILVER: 500,
	BRONZE: 0,
};

function determineRank(score: number): string {
	if (score >= SCORE_THRESHOLDS.LEGEND) return "legend";
	if (score >= SCORE_THRESHOLDS.MASTER) return "master";
	if (score >= SCORE_THRESHOLDS.DIAMOND) return "diamond";
	if (score >= SCORE_THRESHOLDS.PLATINUM) return "platinum";
	if (score >= SCORE_THRESHOLDS.GOLD) return "gold";
	if (score >= SCORE_THRESHOLDS.SILVER) return "silver";
	return "bronze";
}

async function updateLeaderboard(users: { userId: string; score: number }[]) {
	const { rows: currentLeaderboard } = await pool.query(
		"SELECT userid, score, rank FROM leaderboard"
	);
	const dbMap = new Map(currentLeaderboard.map(u => [u.userid, u]));

	const top3 = [...users]
		.sort((a, b) => b.score - a.score)
		.slice(0, 3)
		.map(u => u.userId);

	for (const user of users) {
		const entry = dbMap.get(user.userId);
		//@ts-ignore
		const currentScore = typeof entry?.score === "number" ? entry.score : 0;
		//@ts-ignore
		const currentRank = entry?.rank || "bronze";

		let roundScore = user.score;

		if (top3.includes(user.userId)) roundScore *= 1.02;

		if (["legend", "master", "diamond"].includes(String(currentRank)))
			roundScore *= 1.05;

		let finalScore;
		if (top3.includes(user.userId)) {
			finalScore = currentScore + Math.floor(roundScore);
		} else {
			const isHighRank = ["legend", "master", "diamond"].includes(
				String(currentRank)
			);
			const penaltyMultiplier = isHighRank ? 0.85 : 0.92;
			finalScore = currentScore + Math.floor(roundScore * penaltyMultiplier);
		}

		finalScore = Math.max(finalScore, 0);
		const newRank = determineRank(finalScore);

		if (entry) {
			await pool.query(
				"UPDATE leaderboard SET score = $1, rank = $2 WHERE userid = $3",
				[finalScore, newRank, user.userId]
			);
		} else {
			await pool.query(
				"INSERT INTO leaderboard (userid, score, rank) VALUES ($1, $2, $3)",
				[user.userId, finalScore, newRank]
			);
		}
	}

	const { rows: updatedLeaderboard } = await pool.query(
		"SELECT userid, score, rank FROM leaderboard ORDER BY score DESC, userid ASC"
	);
	return updatedLeaderboard.map(u => ({
		userId: u.userid,
		score: u.score,
		rank: u.rank,
	}));
}

async function resetLeaderboard() {
	await pool.query("DELETE FROM leaderboard");
}

async function getLeaderboard(): Promise<
	{
		userId: string;
		score: number;
		rank: string;
	}[]
> {
	const { rows } = await pool.query(
		"SELECT userid, score, rank FROM leaderboard ORDER BY score DESC, userid ASC"
	);
	return rows.map(u => ({
		userId: String(u.userid ?? ""),
		score: Number(u.score ?? 0),
		rank: String(u.rank ?? "bronze"),
	}));
}

export { updateLeaderboard, resetLeaderboard, UserRank, getLeaderboard };
