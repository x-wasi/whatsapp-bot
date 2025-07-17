import {
	AutoKickDb,
	en,
	getFact,
	getInsult,
	getQuote,
	Greetings,
	GroupDb,
	logo,
} from "lib";
import type { BaileysEventMap, WASocket } from "baileys";

export default async (
	client: WASocket,
	updates: BaileysEventMap["group-participants.update"]
) => {
	try {
		const { id, author, participants, action } = updates;

		const autokicklist = AutoKickDb.get(id, participants[0]);
		if (autokicklist && action === "add") {
			await client.sendMessage(id, {
				text: `\`\`\`@${
					participants[0].split("@")[0]
				} loser is back, now kicking you off\`\`\``,
				mentions: participants,
			});
			await client.sendMessage(id, {
				text: `\`\`\`@${
					participants[0].split("@")[0]
				} was kicked due to AutoKick\`\`\``,
				mentions: participants,
			});
			await client.groupParticipantsUpdate(id, participants, "remove");
			return;
		}

		const groupEvent = GroupDb.get(id);
		if (groupEvent && ["promote", "demote", "modify"].includes(action)) {
			const participant = participants[0];
			let profileImg: string | undefined;

			try {
				profileImg = await client.profilePictureUrl(participant, "image");
			} catch (error) {
				console.warn(
					`Failed to fetch profile picture for ${participant}: ${error.message}`
				);
			}

			const content = `\`\`\`@${participant.split("@")[0]} ${
				action === "promote"
					? `was given the administrator role by @${author.split("@")[0]}`
					: action === "demote"
					? `was removed from their admin role by @${author.split("@")[0]}`
					: ""
			}\`\`\``.trim();

			const message = profileImg
				? { image: { url: profileImg }, caption: content }
				: { text: content };

			await client.sendMessage(id, {
				...message,
				contextInfo: {
					mentionedJid: [participant, author],
					externalAdReply: {
						title: en.meta.botname,
						body: en.meta.desc,
						thumbnail: logo,
						showAdAttribution: true,
					},
				},
			});
			return;
		}

		const welcomeMsg = Greetings.welcome.get(id);
		const goodbyeMsg = Greetings.goodbye.get(id);
		if (["add", "remove"].includes(action) && (welcomeMsg || goodbyeMsg)) {
			const participant = participants[0];
			let profileImg: string | undefined;

			try {
				profileImg = await client.profilePictureUrl(participant, "image");
			} catch (error) {
				console.warn(
					`Failed to fetch profile picture for ${participant}: ${error.message}`
				);
			}

			const groupMetadata = await client.groupMetadata(id).catch(error => {
				console.error(`Failed to fetch group metadata for ${id}: ${error.message}`);
				return { participants: [], subject: "", desc: "" };
			});

			const replacements = {
				"@user": `@${participant.split("@")[0]}`,
				"@gdesc": groupMetadata.desc || "",
				"@gname": groupMetadata.subject || "",
				"@fact": getFact(),
				"@insult": getInsult(),
				"@quotes": getQuote(),
				"@members": `${groupMetadata.participants.length || 0}`,
			};

			let text = action === "add" ? welcomeMsg : goodbyeMsg;
			if (!text) return;

			const hasImage = profileImg && text.includes("@pp");
			text = text.replace(/@pp/g, "");

			for (const [placeholder, value] of Object.entries(replacements)) {
				text = text.replace(new RegExp(placeholder, "g"), value);
			}

			const messageContent =
				hasImage && profileImg
					? { image: { url: profileImg }, caption: `\`\`\`${text.trim()}\`\`\`` }
					: { text: `\`\`\`${text.trim()}\`\`\`` };

			await client.sendMessage(id, {
				...messageContent,
				contextInfo: {
					mentionedJid: [participant, author].filter(Boolean),
					externalAdReply: {
						title: en.meta.botname,
						body: en.meta.desc,
						thumbnail: logo,
						showAdAttribution: true,
					},
				},
			});
		}
	} catch (error) {
		console.error(`Error in group participant update: ${error.message}`);
	}
};
