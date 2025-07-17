import fs from "fs";
import path from "path";
import { tmpdir } from "os";
import Crypto from "crypto";
import webp from "node-webpmux";
import { ImgToWebp, videoToWebp } from "./webp";

type MediaInput = Buffer | string;
type Metadata = {
	packname?: string;
	author?: string;
	categories?: string[];
};

export const writeExif = async (
	input: MediaInput,
	metadata: Metadata,
	type: "image" | "video" | "webp"
): Promise<string> => {
	const buffer = Buffer.isBuffer(input) ? input : fs.readFileSync(input);

	const tmpFileIn = path.join(
		tmpdir(),
		`${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`
	);
	const tmpFileOut = path.join(
		tmpdir(),
		`${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`
	);

	if (type === "image") {
		const inputPath =
			typeof input === "string"
				? input
				: (() => {
						const tmpImg = path.join(
							tmpdir(),
							`${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.jpg`
						);
						fs.writeFileSync(tmpImg, buffer);
						return tmpImg;
				  })();
		const outputPath = await ImgToWebp(inputPath);
		fs.copyFileSync(outputPath, tmpFileIn);
	} else if (type === "video") {
		const webpBuffer = await videoToWebp(buffer);
		fs.writeFileSync(tmpFileIn, webpBuffer);
	} else {
		fs.writeFileSync(tmpFileIn, buffer);
	}

	const img = new webp.Image();
	const json = {
		"sticker-pack-id": "https://github.com/AstroX11/whatsapp-bot",
		"sticker-pack-name": metadata?.packname ?? `xsᴛʀᴏ`,
		"sticker-pack-publisher": metadata?.author ?? `αѕтяσχ11`,
		emojis: metadata.categories ?? [""],
	};
	const exifAttr = Buffer.from([
		0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07,
		0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
	]);
	const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
	const exif = Buffer.concat([exifAttr, jsonBuff]);
	exif.writeUIntLE(jsonBuff.length, 14, 4);
	await img.load(tmpFileIn);
	fs.unlinkSync(tmpFileIn);
	img.exif = exif;
	await img.save(tmpFileOut);
	return tmpFileOut;
};
