import { CommandModule } from "@types";
import { isLidUser } from "baileys";
import { Serialize, updateLeaderboard } from "lib";

const games = new Map<string, Wcg>();
const pending = new Map<string, { jids: string[]; timers: NodeJS.Timeout[] }>();

export default [
	{
		pattern: "wcg",
		fromMe: false,
		isGroup: false,
		desc: "Play Word Chain Game",
		type: "games",
		handler: async (message, match) => {
			const jid = message.chat;

			if (match === "end") {
				if (games.has(jid)) {
					const game = games.get(jid)!;
					const ev = await game.endGame(jid, true);
					return message.send(ev, {
						mentions: game.originalPlayers,
						to: message.chat,
					});
				}
				return message.send("```No active Word Chain Game to end.```");
			}

			if (games.has(jid))
				return message.send("```A Word Chain Game is already in progress.```");
			if (pending.has(jid))
				return message.send(
					"```A Word Chain Game is already gathering challengers.```"
				);

			pending.set(jid, { jids: [], timers: [] });

			await message.send(
				'```Word Chain Game starting! Type "join" to participate.```'
			);

			let countdown = 30;
			let lastCountdown = 30;

			const countdownInterval = setInterval(async () => {
				if (countdown <= 0) {
					clearInterval(countdownInterval);
					return;
				}

				if (
					countdown !== lastCountdown &&
					(countdown === 30 || countdown === 20 || countdown === 10)
				) {
					await message.send(`\`\`\`Game starting in ${countdown} seconds.\`\`\``);
					lastCountdown = countdown;
				}
				countdown -= 10;
			}, 10000);

			const startTimer = setTimeout(async () => {
				clearInterval(countdownInterval);
				const p = pending.get(jid)!;
				pending.delete(jid);
				p.timers.forEach(t => clearTimeout(t));

				if (!p.jids.includes(message.sender)) p.jids.push(message.sender);

				const game = new Wcg(message);
				const result = await game.startGame(p.jids, jid);
				if (result)
					return message.send(result, { mentions: p.jids, to: message.chat });

				games.set(jid, game);
				const playersText = p.jids.map(id => `@${id.split("@")[0]}`).join(", ");
				await message.send(
					`\`\`\`Word Chain Game started! Challengers: ${playersText}\`\`\``,
					{ mentions: p.jids, to: message.chat }
				);
			}, 30000);

			pending.get(jid)!.timers.push(startTimer);
		},
	},
	{
		on: true,
		dontAddCommandList: true,
		handler: async message => {
			const jid = message.chat;
			const text = message.text?.trim().toLowerCase();
			if (!text) return;

			if (
				text.includes("game started!") ||
				text.includes("word chain game") ||
				!message.sender ||
				/\s/.test(text)
			)
				return;

			if (text === "join" && pending.has(jid)) {
				const p = pending.get(jid)!;
				if (!p.jids.includes(message.sender)) {
					p.jids.push(message.sender);
					return message.send(
						`\`\`\`@${message.sender.split("@")[0]} joined the Match.\`\`\``,
						{ mentions: [message.sender], to: message.chat }
					);
				}
				return;
			}

			if (games.has(jid)) {
				const game = games.get(jid)!;
				const res = await game.playWord(text, message.sender);
				if (res.text) {
					return message.send(res.text, {
						mentions: res.mentions,
						to: message.chat,
					});
				}
			}
		},
	},
] satisfies CommandModule[];

class Wcg {
	message: Serialize;
	originalPlayers: string[] = [];
	players: string[] = [];
	currentIndex: number = 0;
	scores: Map<string, number> = new Map();
	usedWords: Set<string> = new Set();
	lastLetter: string = "";
	active: boolean = false;
	timer: NodeJS.Timeout | null = null;
	history: Array<{
		players: string[];
		winner: string | null;
		scores: Array<{ player: string; score: number }>;
	}> = [];
	turnNumber: number = 0;
	startCountdown: NodeJS.Timeout | null = null;
	inactivityTimeout: NodeJS.Timeout | null = null;
	currentTimeout: number = 0;
	minLen: number = 3;
	alphabet: string = "abcdefghijklmnopqrstuvwxyz";
	endedByCommand: boolean = false;

	constructor(message: Serialize) {
		this.message = message;
	}

	async startGame(jids: string[], jid: string): Promise<string> {
		if (this.startCountdown) clearTimeout(this.startCountdown);
		this.originalPlayers = [...jids];
		this.players = [...jids];

		if (jids.length < 2) {
			this.cleanup(jid);
			return `\`\`\`Insufficient challengers to begin the Word Chain Game! At least 2 players are required.\`\`\``;
		}
		this.beginGame(jid);
		return "";
	}

	async beginGame(jid: string): Promise<void> {
		if (this.players.length < 2) {
			this.cleanup(jid);
			await this.message.send(
				"```Insufficient challengers to begin the Word Chain Game! At least 2 players are required.```",
				{ mentions: this.originalPlayers, to: this.message.chat }
			);
			return;
		}
		this.currentIndex = 0;
		this.scores = new Map(this.players.map(j => [j, 0]));
		this.usedWords.clear();
		this.lastLetter = this.alphabet[Math.floor(Math.random() * 26)];
		this.minLen = 3;
		this.active = true;
		this.turnNumber = 0;
		this.endedByCommand = false;
		this.scheduleNextTurn(jid);
		const prompt: string = this.getTurnPrompt();
		await this.message.send(prompt, {
			mentions: [this.players[this.currentIndex]],
			to: this.message.chat,
		});
	}

	async playWord(
		input: string,
		from: string
	): Promise<{ text: string; mentions: string[] }> {
		if (!this.active) return { text: "", mentions: [] };

		const currentPlayerJid: string = this.players[this.currentIndex];
		if (from !== currentPlayerJid) return { text: "", mentions: [] };

		const currentPlayerName: string = currentPlayerJid.split("@")[0];
		const word: string = input.toLowerCase().trim();

		this.minLen = Math.floor(this.turnNumber / 5) + 3;

		if (word.length < this.minLen) {
			const msg = `\`\`\`@${currentPlayerName}, you've been eliminated.\nYour word "${word}" is too short. Words must be at least ${this.minLen} letters long.\`\`\``;
			return {
				text: await this.eliminate(currentPlayerJid, msg),
				mentions: this.originalPlayers,
			};
		}

		if (this.lastLetter && word[0] !== this.lastLetter) {
			const msg = `\`\`\`@${currentPlayerName}, you've been eliminated.\nYour word "${word}" must start with "${this.lastLetter.toUpperCase()}".\`\`\``;
			return {
				text: await this.eliminate(currentPlayerJid, msg),
				mentions: this.originalPlayers,
			};
		}

		if (this.usedWords.has(word)) {
			const msg = `\`\`\`@${currentPlayerName}, you've been eliminated.\nThe word "${word}" has already been used in this challenge.\`\`\``;
			return {
				text: await this.eliminate(currentPlayerJid, msg),
				mentions: this.originalPlayers,
			};
		}

		const valid: boolean = await this.checkWord(word);
		if (!valid) {
			const msg = `\`\`\`@${currentPlayerName}, you've been eliminated.\n"${word}" is an invalid word.\`\`\``;
			return {
				text: await this.eliminate(currentPlayerJid, msg),
				mentions: this.originalPlayers,
			};
		}

		this.clearTimer();
		this.resetInactivityTimer();
		this.usedWords.add(word);
		const pts: number = word.length;
		this.scores.set(
			currentPlayerJid,
			(this.scores.get(currentPlayerJid) || 0) + pts
		);
		this.lastLetter = word[word.length - 1];
		this.currentIndex = (this.currentIndex + 1) % this.players.length;
		this.turnNumber++;
		this.scheduleNextTurn(this.message.chat);

		const nextPlayerJid: string = this.players[this.currentIndex];
		const nextPlayerName: string = nextPlayerJid.split("@")[0];

		return {
			text: `\`\`\`@${currentPlayerName} scores ${pts} points for "${word}" in the Game!\n\n@${nextPlayerName}, your challenge awaits:\nSubmit a word starting with "${this.lastLetter.toUpperCase()}" (${
				this.minLen
			}+ letters).\nYou have ${
				this.currentTimeout / 1000
			} seconds to respond!\`\`\``,
			mentions: [currentPlayerJid, nextPlayerJid],
		};
	}

	async checkWord(w: string): Promise<boolean> {
		try {
			const resp = await fetch(`https://api.datamuse.com/words?sp=${w}&max=1`);
			const arr = await resp.json();
			return arr.length > 0 && arr[0].word === w;
		} catch {
			return false;
		}
	}

	async eliminate(jid: string, msg: string): Promise<string> {
		this.clearTimer();
		this.players = this.players.filter(p => p !== jid);
		if (this.currentIndex >= this.players.length) this.currentIndex = 0;

		if (this.players.length <= 1) {
			return msg + "\n\n" + (await this.endGame(this.message.chat, false));
		}

		this.scheduleNextTurn(this.message.chat);
		const nextPlayer: string = this.players[this.currentIndex];
		const nextPlayerName: string = nextPlayer.split("@")[0];
		return `${msg}\n\n\`\`\`@${nextPlayerName}, your challenge awaits:\nSubmit a word starting with "${this.lastLetter.toUpperCase()}" (${
			this.minLen
		}+ letters).\nYou have ${
			this.currentTimeout / 1000
		} seconds to respond!\`\`\``;
	}

	getCurrentTimeout(): number {
		if (this.minLen === 3) this.currentTimeout = 35000;
		else if (this.minLen === 4) this.currentTimeout = 30000;
		else if (this.minLen === 5) this.currentTimeout = 25000;
		else if (this.minLen === 6) this.currentTimeout = 22000;
		else if (this.minLen === 7) this.currentTimeout = 18000;
		else this.currentTimeout = 14000;
		return this.currentTimeout;
	}

	scheduleNextTurn(jid: string): void {
		const timeout: number = this.getCurrentTimeout();
		if (!this.active || !this.players.length) {
			this.cleanup(jid);
			return;
		}
		this.clearTimer();
		this.timer = setTimeout(async () => {
			if (this.active && this.players.length) {
				const playerJid: string = this.players[this.currentIndex];
				const name: string = playerJid.split("@")[0];
				const message: string = `\`\`\`@${name}, you've been eliminated from the Word Chain Game!\nYou ran out of time to submit a word.\`\`\``;
				const out: string = await this.eliminate(playerJid, message);
				if (out) {
					await this.message.send(out, {
						mentions: this.players.length
							? [this.players[this.currentIndex], ...this.originalPlayers]
							: this.originalPlayers,
						to: this.message.chat,
					});
				}
			} else {
				this.cleanup(jid);
			}
		}, timeout);
	}

	clearTimer(): void {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	}

	resetInactivityTimer(): void {
		if (this.inactivityTimeout) {
			clearTimeout(this.inactivityTimeout);
		}
		this.inactivityTimeout = setTimeout(async () => {
			if (this.active) {
				const endMsg: string = await this.forceEndGame(this.message.chat);
				await this.message.send(endMsg, {
					mentions: this.originalPlayers,
					to: this.message.chat,
				});
			}
		}, 60000);
	}

	async endGame(jid: string, byCommand: boolean = false): Promise<string> {
		this.endedByCommand = byCommand;
		this.active = false;

		const scoreArray: [string, number][] = this.originalPlayers.map(p => [
			p,
			this.scores.get(p) || 0,
		]);
		scoreArray.sort((a, b) => b[1] - a[1]);

		const scoreText: string = scoreArray
			.map(([p, s]) => `@${p.split("@")[0]}: ${s} points`)
			.join("\n");

		let result: string;
		if (byCommand) {
			result = `\`\`\`The Word Chain Game was ended by command!\n\nCurrent standings:\n${scoreText}\`\`\``;
		} else if (this.players.length === 1) {
			const winner = this.players[0];
			const winnerName = winner.split("@")[0];
			const winnerScore = this.scores.get(winner) || 0;
			result = `\`\`\`@${winnerName} wins the Word Chain Game with ${winnerScore} points!\n\nFinal standings:\n${scoreText}\`\`\``;
		} else {
			result = `\`\`\`The Word Chain Game has concluded!\n\nFinal standings:\n${scoreText}\`\`\``;
		}

		const validPlayers = this.originalPlayers.filter(userId => isLidUser(userId));
		await updateLeaderboard(
			validPlayers.map(userId => ({
				userId,
				score: this.scores.get(userId) || 0,
			}))
		);

		this.cleanup(jid);
		return result;
	}

	async forceEndGame(jid: string): Promise<string> {
		const scoreArray: [string, number][] = this.originalPlayers.map(p => [
			p,
			this.scores.get(p) || 0,
		]);
		scoreArray.sort((a, b) => b[1] - a[1]);

		const scoreText: string = scoreArray
			.map(([p, s]) => `@${p.split("@")[0]}: ${s} points`)
			.join("\n");

		const result: string = `\`\`\`The Word Chain Game has ended due to inactivity!\n\nFinal standings:\n${scoreText}\`\`\``;

		const validPlayers = this.originalPlayers.filter(userId => isLidUser(userId));
		await updateLeaderboard(
			validPlayers.map(userId => ({
				userId,
				score: this.scores.get(userId) || 0,
			}))
		);

		this.cleanup(jid);
		return result;
	}

	cleanup(jid: string): void {
		this.active = false;
		if (this.startCountdown) {
			clearTimeout(this.startCountdown);
			this.startCountdown = null;
		}
		this.clearTimer();
		if (this.inactivityTimeout) {
			clearTimeout(this.inactivityTimeout);
			this.inactivityTimeout = null;
		}
		this.players = [];
		this.scores.clear();
		this.usedWords.clear();
		this.lastLetter = "";
		this.currentIndex = 0;
		this.turnNumber = 0;
		this.history = [];
		this.currentTimeout = 0;
		this.minLen = 3;
		games.delete(jid);
	}

	getTurnPrompt(): string {
		if (!this.active || !this.players.length) return "";
		const jid: string = this.players[this.currentIndex];
		const name: string = jid.split("@")[0];
		if (!this.lastLetter) {
			this.lastLetter = this.alphabet[Math.floor(Math.random() * 26)];
		}
		this.minLen = Math.floor(this.turnNumber / 5) + 3;
		return `\`\`\`@${name}, your challenge awaits in this Match:\nSubmit a word starting with "${this.lastLetter.toUpperCase()}" (${
			this.minLen
		}+ letters).\nYou have ${
			this.currentTimeout / 1000
		} seconds to respond!\`\`\``;
	}

	getCurrentPlayer(): string {
		return this.players[this.currentIndex] || "";
	}

	getNextPlayer(): string {
		return this.players[(this.currentIndex + 1) % this.players.length] || "";
	}
}
