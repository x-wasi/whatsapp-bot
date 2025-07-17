import { jidNormalizedUser, normalizeMessageContent } from "baileys";
import { extractTxt, isAdmin, isBotAdmin, Settings } from "lib";
import { downloadMessage, edit, send, deleteM, forwardM, userId } from "./sock";
import type { sendOptions } from "./sock";
import type {
	WAContextInfo,
	WAMessage,
	WAMessageContent,
	WASocket,
} from "baileys";

export async function serialize(sock: WASocket, msg: WAMessage) {
	let { key, message, broadcast, pushName } = msg;
	const { logger, ev, ws, authState, signalRepository, user, ...socket } = sock;

	message = normalizeMessageContent(message);
	broadcast = Boolean(broadcast);

	const chat = key.remoteJid;
	const isGroup = Boolean(key.remoteJid?.endsWith("@g.us"));

	const owner = {
		jid: jidNormalizedUser(sock.user?.id),
		lid: jidNormalizedUser(sock.user?.lid),
	};

	const mtype = Object.keys(message ?? "").find(
		k =>
			(k === "conversation" || k.includes("Message")) &&
			k !== "senderKeyDistributionMessage"
	) as keyof WAMessageContent | undefined;

	let quoted: WAContextInfo | undefined;
	let quotedM: WAMessageContent | null | undefined;
	let quotedType: keyof WAMessageContent | undefined;

	if (
		mtype &&
		message &&
		typeof message[mtype] === "object" &&
		message[mtype] !== null &&
		"contextInfo" in message[mtype]
	) {
		quoted = (message[mtype] as { contextInfo?: WAContextInfo })?.contextInfo;
		quotedM = quoted ? quoted.quotedMessage : undefined;
	}

	const prefix = Settings.prefix.get();

	return {
		chat,
		key,
		isGroup,
		broadcast,
		owner,
		mtype,
		pushName,
		prefix,
		sender:
			isGroup || broadcast
				? key.participant
				: key.fromMe
				? owner.jid
				: key.remoteJid,
		message: message,
		isAdmin: isGroup ? isAdmin(chat, key.participant) : null,
		isBotAdmin: isGroup ? isBotAdmin(owner, chat) : null,
		text: extractTxt(message),
		mentions: quoted?.mentionedJid,
		image: !!message?.imageMessage,
		video: !!message?.videoMessage,
		audio: !!message?.audioMessage,
		document: !!message?.documentMessage,
		sticker: !!(message?.stickerMessage || message?.lottieStickerMessage),
		viewonce: key.isViewOnce,
		messageTimestamp: msg.messageTimestamp,
		quoted:
			quoted && quoted.stanzaId
				? {
						key: {
							remoteJid: key.remoteJid,
							fromMe: [owner.jid, owner.lid].includes(quoted.participant!),
							id: quoted.stanzaId,
							participant: isGroup ? quoted.participant : undefined,
						},
						broadcast: Boolean(quoted?.remoteJid),
						sender: quoted.participant,
						message: quotedM,
						mtype: quotedType,
						text: extractTxt(message),
						//@ts-ignore
						viewonce: !!quotedM?.[quotedType]?.viewOnce,
						image: !!quotedM?.imageMessage,
						video: !!quotedM?.videoMessage,
						audio: !!quotedM?.audioMessage,
						document: !!quotedM?.documentMessage,
						sticker: !!(quotedM?.stickerMessage || message?.lottieStickerMessage),
				  }
				: undefined,
		send: async function (content: any, opts: sendOptions = { to: chat! }) {
			return await serialize(sock, await send(sock, content, opts));
		},
		edit: async function (text: string, msg?: WAMessage) {
			msg = msg ?? this.quoted ?? this;
			return await serialize(sock, await edit(sock, text, msg));
		},
		download: async function (message?: WAMessage, save?: boolean) {
			message = message ?? this.quoted ?? this;
			return await downloadMessage({ message, save });
		},
		delete: async function (msg?: WAMessage) {
			msg = msg ?? this.quoted ?? this;
			return await deleteM(sock, msg);
		},
		forward: async function (
			jid: string,
			message?: WAMessage,
			options?: WAContextInfo & { quoted: WAMessage }
		) {
			message = message ?? this.quoted ?? this;
			return await forwardM(sock, jid, message, options);
		},
		user: async function (id?: string) {
			return await userId(this, id);
		},
		...socket,
	};
}

export type Serialize = ReturnType<typeof serialize> extends Promise<infer T>
	? T
	: undefined;
