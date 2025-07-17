import { Readable } from "stream";
import { isUrl } from "../constants";
import { getBuffer } from "../fetch";
import { DataType } from "../datatype";
import type { WAContextInfo, WAMessage, WASocket } from "baileys";

export type sendOptions = {
	to: string;
	type?: "text" | "image" | "video" | "audio" | "sticker" | "document";
	mimetype?: string;
	ptt?: boolean;
	fileName?: string;
	mentions?: string[];
	quoted?: WAMessage;
	contextInfo?: WAContextInfo;
};

export async function send(
	sock: WASocket,
	content: string | URL | Buffer | Readable,
	options: sendOptions
) {
	let data = content;

	if (typeof data === "string" && isUrl(data)) {
		data = await getBuffer(data);
	}

	const mtype =
		options.mimetype && options.type
			? { type: options.type, mimetype: options.mimetype }
			: await DataType(data);

	const payload = constructPayload(data, mtype, options);

	return (await sock.sendMessage(options.to, {
		...payload,
		contextInfo: { mentionedJid: options.mentions, ...options },
	})) as WAMessage;
}

function constructPayload(
	data: string | URL | Buffer | Readable,
	mtype: { type: string; mimetype?: string },
	options: sendOptions
) {
	const { type, mimetype } = mtype;

	switch (type) {
		case "text":
			return { text: data as string };

		case "image":
			return {
				image: data as Buffer,
				...(mimetype && { mimetype }),
			};

		case "video":
			return {
				video: data as Buffer,
				...(mimetype && { mimetype }),
			};

		case "audio":
			return {
				audio: data as Buffer,
				...(mimetype && { mimetype }),
				...(options.ptt && { ptt: true }),
			};

		case "sticker":
			return {
				sticker: data as Buffer,
			};

		case "document":
			if (!mimetype) {
				throw new Error("Document messages require mimetype");
			}
			return {
				document: data as Buffer,
				mimetype,
				fileName: options.fileName ?? "document",
			};

		default:
			throw new Error(`Unsupported message type: ${type}`);
	}
}
