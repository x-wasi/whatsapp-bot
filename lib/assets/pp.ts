import { CommandModule } from "@types";
import { en } from "lib/resources";

export default [
	{
		pattern: "pp",
		fromMe: true,
		isGroup: false,
		desc: "Update your profile image",
		type: "whatsapp",
		handler: async message => {
			const msg = message.quoted;
			if (!msg || !msg.image) return message.send(en.reply_image);
			const media = await message.download();
			await message.updateProfilePicture(message.owner.jid, media as Buffer);
			return message.send(en.plugin.pp.success);
		},
	},
	{
		pattern: "rpp",
		fromMe: true,
		isGroup: false,
		desc: "Remove your profile image",
		type: "whatsapp",
		handler: async message => {
			await message.removeProfilePicture(message.owner.jid);
			return message.send(en.plugin.pp.success);
		},
	},
	{
		pattern: "fullpp",
		fromMe: true,
		isGroup: false,
		desc: "Update your profile image with High Res",
		type: "whatsapp",
		handler: async message => {
			const msg = message.quoted;
			if (!msg || !msg.image) return message.send(en.reply_image);
			const media = await message.download();
			await message.updateProfilePicture(message.owner.jid, media as Buffer, {
				width: 320,
				height: 720,
			});
			return message.send(en.plugin.pp.success);
		},
	},
] satisfies CommandModule[];
