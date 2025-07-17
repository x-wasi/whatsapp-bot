import { CommandModule } from "@types";
import { en } from "lib/resources";

export default [
	{
		pattern: "vv",
		aliases: ["viewonce"],
		fromMe: true,
		isGroup: false,
		desc: "Converts view-once to message",
		type: "whatsapp",
		handler: async msg => {
			const quoted = msg.quoted;
			if (!quoted?.viewonce)
				return msg.send("Use, your phone to reply a viewonce");
			if (msg.message && msg.mtype && msg.message[msg.mtype]) {
				//@ts-ignore
				msg.message[msg.mtype].viewOnce = false;
			}
			return await msg.forward(msg.chat, msg, { quoted: msg });
		},
	},
	{
		pattern: "tovv",
		aliases: ["to-viewonce"],
		fromMe: true,
		isGroup: false,
		desc: "Converts message to view-once",
		type: "whatsapp",
		handler: async msg => {
			const quoted = msg.quoted;
			if (!quoted || (!quoted.audio && !quoted.video && !quoted.image))
				return msg.send(en.reply_msg);
			if (quoted.message && quoted.mtype && quoted.message[quoted.mtype]) {
				// @ts-ignore
				quoted.message[quoted.mtype].viewOnce = true;
			}
			return await msg.forward(msg.chat, msg, { quoted: msg });
		},
	},
] satisfies CommandModule[];
