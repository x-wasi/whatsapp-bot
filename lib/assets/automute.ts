import { CommandModule } from "@types";
import { AutoMuteDb } from "lib/schema";

export default [
	{
		pattern: "amute",
		fromMe: false,
		isGroup: true,
		desc: "Automatically mute at a specific time",
		type: "muting",
		handler: async (msg, args) => {
			if (!args || args.length < 1) {
				return await msg.send("Usage: amute 5:30pm");
			}

			const startTime = args.trim().toLowerCase();
			if (!isValidTimeString(startTime)) {
				return await msg.send(
					"Invalid time format. Use format like `5:30pm` or `7:00am`."
				);
			}

			AutoMuteDb.set(msg.chat, startTime);
			return await msg.send(
				`_Group will be auto-muted everyday at ${startTime.toUpperCase()}._`
			);
		},
	},
	{
		pattern: "aunmute",
		fromMe: false,
		isGroup: true,
		desc: "Automatically unmute at a specific time",
		type: "muting",
		handler: async (msg, args) => {
			if (!args || args.length < 1) {
				return await msg.send("Usage: aunmute 6:30am");
			}

			const endTime = args.trim().toLowerCase();
			if (!isValidTimeString(endTime)) {
				return await msg.send(
					"Invalid time format. Use format like `6:30am` or `8:00pm`."
				);
			}

			const existing = AutoMuteDb.get(msg.chat);
			const startTime = existing?.startTime ?? null;

			AutoMuteDb.set(msg.chat, startTime as string, endTime);
			return await msg.send(
				`_Group will be auto-unmuted everyday at ${endTime.toUpperCase()}._`
			);
		},
	},
	{
		pattern: "delmute",
		fromMe: false,
		isGroup: true,
		desc: "Delete automute setting for the group",
		type: "muting",
		handler: async msg => {
			AutoMuteDb.remove(msg.chat);
			return await msg.send("_Automute setting deleted for this group._");
		},
	},
	{
		pattern: "getmute",
		fromMe: false,
		isGroup: true,
		desc: "Get current automute setting for the group",
		type: "muting",
		handler: async msg => {
			const automute = AutoMuteDb.get(msg.chat);
			if (!automute) {
				return await msg.send("_No automute setting found for this group._");
			}

			const { startTime, endTime } = automute;
			return await msg.send(
				`_Automute is currently set${startTime ? ` from ${startTime}` : ""}${
					endTime ? ` to ${endTime}` : ""
				}._`
			);
		},
	},
] satisfies CommandModule[];

export function isValidTimeString(timeStr: string): boolean {
	const match = timeStr
		.trim()
		.toLowerCase()
		.match(/^(\d{1,2}):(\d{2})(am|pm)$/);
	if (!match) return false;
	const [_, hours, minutes, period] = match;
	const h = parseInt(hours, 10);
	const m = parseInt(minutes, 10);
	return (
		h >= 1 && h <= 12 && m >= 0 && m <= 59 && (period === "am" || period === "pm")
	);
}
