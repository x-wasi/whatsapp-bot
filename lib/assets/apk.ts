import type { CommandModule } from "@types";

export default {
	pattern: "apk",
	aliases: ["app"],
	fromMe: false,
	isGroup: false,
	desc: "Download APK by app name",
	type: "download",

	handler: async (msg, args) => {
		const appName = args?.trim() ?? msg?.quoted?.text?.trim() ?? "";

		if (!appName) {
			return msg.send("Provide an app name to download!");
		}

		const res = await fetch(
			`https://bk9.fun/download/apk?id=${encodeURIComponent(appName)}`,
			{
				method: "GET",
			}
		);

		const data = await res.json();

		if (!data.status || !data.BK9?.dllink) {
			return msg.send("❌ Failed to fetch APK. Try a different app name.");
		}

		return await msg.send(data.BK9.dllink, {
			fileName: `${appName}.apk`,
			to: msg.chat,
			mimetype: "application/vnd.android.package-archive",
		});
	},
} satisfies CommandModule;
