import { createReadStream } from "fs";
import { Readable } from "stream";
import { spawn } from "child_process";
import { toBuffer } from "baileys";
import type { ILogger } from "baileys/lib/Utils/logger";

export async function PTT(
	input: Buffer | string | Readable,
	logger?: ILogger
): Promise<Buffer | undefined> {
	try {
		let audioData: Buffer;

		if (Buffer.isBuffer(input)) {
			audioData = input;
		} else if (typeof input === "string") {
			const rStream = createReadStream(input);
			audioData = await toBuffer(rStream);
		} else {
			audioData = await toBuffer(input);
		}

		const chunks: Buffer[] = [];

		await new Promise<void>((resolve, reject) => {
			const ffmpeg = spawn("ffmpeg", [
				"-i",
				"pipe:0",
				"-f",
				"ogg",
				"-c:a",
				"libopus",
				"-ar",
				"16000",
				"-ac",
				"1",
				"-b:a",
				"24k",
				"pipe:1",
			]);

			ffmpeg.stdin.write(audioData);
			ffmpeg.stdin.end();

			ffmpeg.stdout.on("data", chunk => chunks.push(chunk));
			ffmpeg.stdout.on("end", resolve);
			ffmpeg.on("error", reject);
		});

		return Buffer.concat(chunks);
	} catch (e) {
		logger?.debug("Failed to convert to PTT: " + e);
	}
}
