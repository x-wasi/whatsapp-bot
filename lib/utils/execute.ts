import { commandMap } from "./plugin";
import { Red, StickerDb } from "lib";
import type { CommandModule } from "@types";
import type { Serialize } from "./serialize";

function exec(cmd: CommandModule, msg: Serialize, match?: string) {
	cmd.handler(msg, match).catch(Red);
}

function text(msg: Serialize) {
	if (!msg?.text) return;

	for (const [, cmd] of commandMap) {
		if (!cmd.patternRegex) continue;

		const match = msg.text.match(cmd.patternRegex);
		if (match) return exec(cmd, msg, match[2]);
	}
}

function sticker(msg: Serialize) {
	const sha =
		msg?.message?.stickerMessage?.fileSha256 ??
		msg?.message?.lottieStickerMessage?.message?.stickerMessage?.fileSha256;

	if (!sha) return;

	const hash = Buffer.from(new Uint8Array(sha)).toString("base64");
	const cmdText = StickerDb.get(hash)?.cmdname;
	if (!cmdText) return;

	for (const [, cmd] of commandMap) {
		if (!cmd.patternRegex) continue;

		const match = cmdText.match(cmd.patternRegex);
		if (match) return exec(cmd, msg, match[2]);
	}
}

function event(msg: Serialize) {
	for (const [, cmd] of commandMap) if (cmd?.on) exec(cmd, msg);
}

export async function execute(msg: Serialize) {
	await Promise.allSettled([text(msg), sticker(msg), event(msg)]);
}
