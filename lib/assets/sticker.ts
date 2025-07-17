import { CommandModule } from "@types";
import { en, StickerDb, commandMap } from "lib";

export default [
	{
		pattern: "setcmd",
		fromMe: true,
		isGroup: false,
		desc: "Use stickers to run a command",
		type: "misc",
		handler: async (message, match) => {
			const msg = message?.quoted;
			if (!msg?.sticker) return await message.send(en.plugin.sticker.not_replied);

			if (!match) return await message.send(en.plugin.sticker.no_name_chose);

			const fileSha256 =
				msg.message?.stickerMessage?.fileSha256 ??
				msg.message?.lottieStickerMessage?.message?.stickerMessage?.fileSha256;

			if (!fileSha256) return;

			const filesha256 = Buffer.from(new Uint8Array(fileSha256)).toString(
				"base64"
			);
			const cmdname = match.trim().toLowerCase();
			const exists = [...commandMap.keys()].includes(cmdname);

			if (!exists) return await message.send(en.cmd_not_exists);

			StickerDb.set(filesha256, cmdname);
			return await message.send(`_Sticker cmd set for ${cmdname}_`);
		},
	},
	{
		pattern: "delcmd",
		fromMe: true,
		isGroup: false,
		desc: "Remove a sticker cmd",
		type: "misc",
		handler: async (message, match) => {
			if (!match) return message.send(en.plugin.sticker.remove_option_null);

			const cmdname = match.trim().toLowerCase();
			const exists = [...commandMap.keys()].includes(cmdname);

			if (!exists) return await message.send(en.cmd_not_exists);

			const removed = StickerDb.remove(cmdname);
			if (!removed) return await message.send(en.plugin.sticker.cmd_not_used);

			return await message.send(`_${cmdname} removed from Sticker_`);
		},
	},
] satisfies CommandModule[];
