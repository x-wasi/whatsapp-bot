import { en, GroupDb, logo, Red } from "lib";
import type { BaileysEventMap, WASocket } from "baileys";

export default async (
	sock: WASocket,
	event: BaileysEventMap["group.join-request"]
) => {
	const { id, author, participant, action, method } = event;
	const enabled = GroupDb.get(id);

	if (!enabled) return;

	try {
		let profileImg: string | undefined;

		try {
			profileImg = await sock.profilePictureUrl(participant, "image");
		} catch {}

		const groupMetadata = await sock.groupMetadata(id);
		const groupName = groupMetadata.subject || "";

		const actionText = getActionText(action, method!);
		const participantName = participant.split("@")[0];
		const authorName = author ? author.split("@")[0] : "System";

		const content = `\`\`\`${actionText
			.replace("@participant", `@${participantName}`)
			.replace("@author", `@${authorName}`)
			.replace("@group", groupName)}\`\`\``;

		const messageContent = profileImg
			? {
					image: { url: profileImg },
					caption: content,
			  }
			: { text: content };

		await sock.sendMessage(id, {
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
	} catch (e) {
		Red(e);
	}
};

function getActionText(action: string, method: string): string {
	const methodText = method === "invite_link" ? "via invite link" : "by request";

	switch (action) {
		case "created":
			return `@participant requested to join @group ${methodText}`;
		case "rejected":
			return `@author rejected @participant's request to join @group`;
		case "revoked":
			return `@participant cancelled their request to join @group`;
		default:
			return `@participant requested to join @group ${methodText}`;
	}
}
