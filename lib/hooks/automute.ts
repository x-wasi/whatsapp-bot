import { en } from "lib/resources";
import { AutoMuteDb } from "lib";
import { cachedGroupMetadataAll } from "src";
import { getCurrentTimeString } from "./timer";
import type { GroupMetadata, WASocket } from "baileys";

export async function groupAutoMute(client: WASocket) {
	const currentTime = getCurrentTimeString();

	for (const [jid] of Object.entries(cachedGroupMetadataAll())) {
		const automute = AutoMuteDb.get(jid);
		if (!automute) continue;

		const isGroupLocked = await client.groupMetadata(jid).then(
			(metadata: GroupMetadata) => metadata?.announce === true,
			() => false
		);

		if (currentTime === automute.startTime!.toLowerCase() && !isGroupLocked) {
			await client.sendMessage(jid, {
				text: en.group_muted,
			});
			await client.groupSettingUpdate(jid, "announcement");
			continue;
		}

		if (
			automute.endTime &&
			currentTime === automute.endTime.toLowerCase() &&
			isGroupLocked
		) {
			await client.sendMessage(jid, {
				text: en.group_unmuted,
			});
			await client.groupSettingUpdate(jid, "not_announcement");
			continue;
		}
	}
}
