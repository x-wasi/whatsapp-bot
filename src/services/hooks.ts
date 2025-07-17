import { checkGitRepoUpToDate, loadPlugins, socketHooks } from "lib";
import type { WASocket } from "baileys";

export default async (socket: WASocket) => {
	await Promise.allSettled([
		checkGitRepoUpToDate(undefined, undefined, "stable"),
		loadPlugins(),
	]);
	return socketHooks(socket);
};
