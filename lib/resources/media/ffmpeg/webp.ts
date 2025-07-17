import { randomBytes } from "crypto";
import { tmpdir } from "os";
import { join, parse } from "path";
import { writeFileSync, readFileSync, unlinkSync } from "fs";
import { runFFmpeg } from "./process";

export async function ImgToWebp(
	input: string | Buffer
): Promise<string | Buffer> {
	const isBuffer = Buffer.isBuffer(input);
	const tmpId = randomBytes(6).toString("hex");
	const inputPath = isBuffer ? join(tmpdir(), `${tmpId}_in`) : input;
	const outputPath = isBuffer
		? join(tmpdir(), `${tmpId}_out.webp`)
		: join(parse(input).dir, `${parse(input).name}.webp`);

	if (isBuffer) writeFileSync(inputPath, input);

	await runFFmpeg([
		"-i",
		inputPath,
		"-vf",
		"scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000",
		"-pix_fmt",
		"yuva420p",
		"-lossless",
		"0",
		"-quality",
		"80",
		outputPath,
	]);

	if (isBuffer) {
		const result = readFileSync(outputPath);
		unlinkSync(inputPath);
		unlinkSync(outputPath);
		return result;
	}

	return outputPath;
}

export async function videoToWebp(
	input: string | Buffer
): Promise<string | Buffer> {
	const isBuffer = Buffer.isBuffer(input);
	const tmpId = randomBytes(6).toString("hex");
	const inputPath = isBuffer ? join(tmpdir(), `${tmpId}_in.mp4`) : input;
	const outputPath = isBuffer
		? join(tmpdir(), `${tmpId}_out.webp`)
		: join(parse(input).dir, `${parse(input).name}.webp`);

	if (isBuffer) writeFileSync(inputPath, input);

	await runFFmpeg([
		"-i",
		inputPath,
		"-vf",
		"scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,fps=15",
		"-pix_fmt",
		"yuva420p",
		"-loop",
		"0",
		"-t",
		"5",
		"-an",
		outputPath,
	]);

	if (isBuffer) {
		const result = readFileSync(outputPath);
		unlinkSync(inputPath);
		unlinkSync(outputPath);
		return result;
	}

	return outputPath;
}
