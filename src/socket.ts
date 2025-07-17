import makeWASocket, { fetchLatestWaWebVersion } from "baileys";
import auth from "./auth";
import cache from "./cache";
import event from "./event";
import config from "../config";
import { cachedGroupMetadata } from "./group";
import { Green, logger, Red, StoreDb } from "lib";

const msgRetryCounterCache = cache();

const { state } = auth();
const { version } = await fetchLatestWaWebVersion({});

const sock = makeWASocket({
	auth: {
		creds: state.creds,
		keys: state.keys,
	},
	version,
	logger,
	msgRetryCounterCache,
	cachedGroupMetadata,
	getMessage: StoreDb.get,
});

if (!sock.authState?.creds?.registered) {
	await new Promise(r => setTimeout(r, 2000));
	Green(`PAIR:`, await sock.requestPairingCode(config.USER_NUMBER, "ASTROX11"));
	while (!sock.authState?.creds?.registered)
		await new Promise(r => setTimeout(r, 2000));
}

await event(sock).catch(Red);
