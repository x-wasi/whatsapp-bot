import { updateMetaGroup } from "src";
import { AutoBioDb, getBio, Red } from "lib";
import { groupAutoMute } from "./automute";
import { startClockAlignedScheduler } from "./timer";
import type { WASocket } from "baileys";

export function socketHooks(sock: WASocket) {
	const schedulerCallback = async () => {
		try {
			if (AutoBioDb.get()) await sock.updateProfileStatus(getBio());
			if (!sock.authState?.creds.registered) {
				await groupAutoMute(sock);
				const data = await sock.groupFetchAllParticipating();
				for (const [jid, metadata] of Object.entries(data)) {
					updateMetaGroup(jid, metadata);
				}
			}
		} catch (e) {
			Red(e);
		}
	};

	return startClockAlignedScheduler(schedulerCallback);
}
