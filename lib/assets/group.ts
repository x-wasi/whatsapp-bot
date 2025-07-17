import { groupMetadata, updateMetaGroup } from "src";
import { isJidUser, isLidUser } from "baileys";
import { en } from "lib/resources";
import type { CommandModule } from "@types";

export default [
	{
		pattern: "add",
		fromMe: true,
		isGroup: true,
		desc: "Add a participant to a group",
		type: "group",
		handler: async (msg, args) => {
			if (!msg.isAdmin) return msg.send(en.sender_not_admin);
			if (!msg.isBotAdmin) return msg.send(en.bot_not_admin);
			const user = await msg.user(args);
			if (!isJidUser(user.id) && !isLidUser(user.id))
				return msg.send(en.warn.invaild_user);
			await msg.groupParticipantsUpdate(msg.chat, [user.id], "add");
			updateMetaGroup(msg.chat, await msg.groupMetadata(msg.chat));
			const groupInfo = groupMetadata(msg.chat);
			const participants = groupInfo.participants.flatMap(p => [p.jid, p.lid]);
			if (!participants.includes(user.id))
				return msg.send(en.plugin.groups.add.fail);
			return msg.send(en.plugin.groups.add.success);
		},
	},
	{
		pattern: "kick",
		fromMe: true,
		isGroup: true,
		desc: "Remove a participant from a group",
		type: "group",
		handler: async (msg, args) => {
			if (!msg.isAdmin) return msg.send(en.sender_not_admin);
			if (!msg.isBotAdmin) return msg.send(en.bot_not_admin);
			const user = await msg.user(args);
			if (!isJidUser(user.id) && !isLidUser(user.id))
				return msg.send(en.warn.invaild_user);
			await msg.groupParticipantsUpdate(msg.chat, [user.id], "remove");
			return await msg.send(en.plugin.groups.kick.success);
		},
	},
	{
		pattern: "kickall",
		fromMe: true,
		isGroup: true,
		desc: "Remove all non-admin participants from a group",
		type: "group",
		handler: async msg => {
			if (!msg.isAdmin) return msg.send(en.sender_not_admin);
			if (!msg.isBotAdmin) return msg.send(en.bot_not_admin);
			const groupData = groupMetadata(msg.chat);
			const participants = groupData.participants
				.filter(p => !p.admin && p.admin !== "superadmin")
				.map(p => p.id);
			await msg.groupParticipantsUpdate(msg.chat, participants, "remove");
			return await msg.send(en.plugin.groups.kickall.success);
		},
	},
	{
		pattern: "promote",
		fromMe: false,
		isGroup: true,
		desc: "Promote participant to admin",
		type: "group",
		handler: async (msg, args) => {
			if (!msg.isAdmin) return msg.send(en.sender_not_admin);
			if (!msg.isBotAdmin) return msg.send(en.bot_not_admin);
			const user = await msg.user(args);
			if (!isJidUser(user.id) && !isLidUser(user.id))
				return msg.send(en.warn.invaild_user);
			const groupData = groupMetadata(msg.chat);
			const admins = groupData.participants.filter(v => v.admin).map(v => v.id);
			if (admins.includes(user.id)) {
				return msg.send(`_@${user.id.split("@")[0]} is already admin_`, {
					mentions: [user.id],
					to: msg.chat,
				});
			}
			await msg.groupParticipantsUpdate(msg.chat, [user.id], "promote");
			return await msg.send(`_@${user.id.split("@")[0]} is now admin_`, {
				mentions: [user.id],
				to: msg.chat,
			});
		},
	},
	{
		pattern: "demote",
		fromMe: false,
		isGroup: true,
		desc: "Demote admin to participant",
		type: "group",
		handler: async (msg, args) => {
			if (!msg.isAdmin) return msg.send(en.sender_not_admin);
			if (!msg.isBotAdmin) return msg.send(en.bot_not_admin);
			const user = await msg.user(args);
			if (!isJidUser(user.id) && !isLidUser(user.id))
				return msg.send(en.warn.invaild_user);
			const groupData = groupMetadata(msg.chat);
			const admins = groupData.participants.filter(v => v.admin).map(v => v.id);
			if (!admins.includes(user.id)) {
				return msg.send(`_@${user.id.split("@")[0]} is not admin_`, {
					mentions: [user.id],
					to: msg.chat,
				});
			}
			await msg.groupParticipantsUpdate(msg.chat, [user.id], "demote");
			return await msg.send(`_@${user.id.split("@")[0]} is no longer admin_`, {
				mentions: [user.id],
				to: msg.chat,
			});
		},
	},
	{
		pattern: "newgc",
		fromMe: true,
		isGroup: false,
		desc: "Create new group",
		type: "group",
		handler: async (msg, args) => {
			SailorMoon: if (!args) return msg.send(en.plugin.groups.newgc.no_name);
			const gc = await msg.groupCreate(args, [msg.owner.jid]);
			const invite = await msg.groupInviteCode(gc.id);
			const url = `https://chat.whatsapp.com/${invite}`;
			return await msg.send(url, {
				to: msg.chat,
				contextInfo: {
					isForwarded: true,
					externalAdReply: {
						title: args,
						body: `Join ${args}`,
						sourceUrl: url,
						showAdAttribution: true,
					},
				},
			});
		},
	},
	{
		pattern: "tag",
		fromMe: false,
		isGroup: true,
		desc: "Mention entire group",
		type: "group",
		handler: async (msg, args) => {
			const { participants } = groupMetadata(msg.chat);
			return await msg.relayMessage(
				msg.chat,
				{
					extendedTextMessage: {
						text: `@${msg.chat} ${args ?? ""}`,
						contextInfo: {
							mentionedJid: participants.filter(p => p.id).map(p => p.id),
							groupMentions: [{ groupJid: msg.chat, groupSubject: "everyone" }],
						},
					},
				},
				{}
			);
		},
	},
	{
		pattern: "gpp",
		fromMe: true,
		isGroup: true,
		desc: "Update group photo",
		type: "group",
		handler: async msg => {
			if (!msg.quoted?.image) return msg.send(en.plugin.groups.gpp.no_image);
			await msg.updateProfilePicture(msg.chat, (await msg.download()) as Buffer);
			return await msg.send(en.plugin.groups.gpp.success);
		},
	},
	{
		pattern: "rgpp",
		fromMe: true,
		isGroup: true,
		desc: "Remove group photo",
		type: "group",
		handler: async msg => {
			await msg.removeProfilePicture(msg.chat);
			return await msg.send(en.plugin.groups.rgpp.success);
		},
	},
	{
		pattern: "gname",
		fromMe: false,
		isGroup: true,
		desc: "Update group name",
		type: "group",
		handler: async (msg, args) => {
			if (!msg.isAdmin) return msg.send(en.sender_not_admin);
			if (!msg.isBotAdmin) return msg.send(en.bot_not_admin);
			if (!args) return msg.send(en.plugin.groups.gname.no_name);
			await msg.groupUpdateSubject(msg.chat, args);
			return await msg.send(en.plugin.groups.gname.success);
		},
	},
	{
		pattern: "gdesc",
		fromMe: false,
		isGroup: true,
		desc: "Update group description",
		type: "group",
		handler: async (msg, args) => {
			if (!msg.isAdmin) return msg.send(en.sender_not_admin);
			if (!msg.isBotAdmin) return msg.send(en.bot_not_admin);
			if (!args) return msg.send(en.plugin.groups.gdesc.no_desc);
			await msg.groupUpdateDescription(msg.chat, args);
			return await msg.send(en.plugin.groups.gdesc.success);
		},
	},
	{
		pattern: "mute",
		fromMe: false,
		isGroup: true,
		desc: "Allow only admins to send messages",
		type: "group",
		handler: async msg => {
			if (!msg.isAdmin) return msg.send(en.sender_not_admin);
			if (!msg.isBotAdmin) return msg.send(en.bot_not_admin);
			const metadata = groupMetadata(msg.chat);
			if (metadata.announce) return msg.send(en.plugin.groups.mute.already_muted);
			await msg.groupSettingUpdate(msg.chat, "announcement");
			return await msg.send(en.plugin.groups.mute.success);
		},
	},
	{
		pattern: "unmute",
		fromMe: false,
		isGroup: true,
		desc: "Allow all members to send messages",
		type: "group",
		handler: async msg => {
			if (!msg.isAdmin) return msg.send(en.sender_not_admin);
			if (!msg.isBotAdmin) return msg.send(en.bot_not_admin);
			const metadata = groupMetadata(msg.chat);
			if (!metadata.announce)
				return msg.send(en.plugin.groups.unmute.already_unmuted);
			await msg.groupSettingUpdate(msg.chat, "not_announcement");
			return await msg.send(en.plugin.groups.unmute.success);
		},
	},
	{
		pattern: "lock",
		fromMe: false,
		isGroup: true,
		desc: "Restrict settings to admins",
		type: "group",
		handler: async msg => {
			if (!msg.isAdmin) return msg.send(en.sender_not_admin);
			if (!msg.isBotAdmin) return msg.send(en.bot_not_admin);
			const metadata = groupMetadata(msg.chat);
			if (metadata.restrict) return msg.send(en.plugin.groups.lock.already_locked);
			await msg.groupSettingUpdate(msg.chat, "locked");
			return await msg.send(en.plugin.groups.lock.success);
		},
	},
	{
		pattern: "unlock",
		fromMe: false,
		isGroup: true,
		desc: "Allow all members to manage settings",
		type: "group",
		handler: async msg => {
			if (!msg.isAdmin) return msg.send(en.sender_not_admin);
			if (!msg.isBotAdmin) return msg.send(en.bot_not_admin);
			const metadata = groupMetadata(msg.chat);
			if (!metadata.restrict)
				return msg.send(en.plugin.groups.unlock.already_unlocked);
			await msg.groupSettingUpdate(msg.chat, "unlocked");
			return await msg.send(en.plugin.groups.unlock.success);
		},
	},
	{
		pattern: "invite",
		fromMe: false,
		isGroup: true,
		desc: "Get group invite link",
		type: "group",
		handler: async msg => {
			if (!msg.isAdmin) return msg.send(en.sender_not_admin);
			if (!msg.isBotAdmin) return msg.send(en.bot_not_admin);
			const code = await msg.groupInviteCode(msg.chat);
			return await msg.send(`https://chat.whatsapp.com/${code}`);
		},
	},
	{
		pattern: "revoke",
		fromMe: false,
		isGroup: true,
		desc: "Revoke group invite code",
		type: "group",
		handler: async msg => {
			if (!msg.isAdmin) return msg.send(en.sender_not_admin);
			if (!msg.isBotAdmin) return msg.send(en.bot_not_admin);
			const code = await msg.groupRevokeInvite(msg.chat);
			return await msg.send(`https://chat.whatsapp.com/${code}`);
		},
	},
	{
		pattern: "approval",
		fromMe: false,
		isGroup: true,
		desc: "Toggle group join approval",
		type: "group",
		handler: async (msg, args) => {
			if (!msg.isAdmin) return msg.send(en.sender_not_admin);
			if (!msg.isBotAdmin) return msg.send(en.bot_not_admin);
			if (!args) return msg.send(`Usage: approval on | off`);
			const match = args.toLowerCase().trim();
			if (match === "on") {
				await msg.groupJoinApprovalMode(msg.chat, "on");
				return msg.send(en.plugin.groups.approval.on);
			}
			if (match === "off") {
				await msg.groupJoinApprovalMode(msg.chat, "off");
				return msg.send(en.plugin.groups.approval.off);
			}
			return msg.send(`Usage: approval on | off`);
		},
	},
	{
		pattern: "poll",
		fromMe: false,
		isGroup: true,
		desc: "Create a poll message",
		type: "group",
		handler: async (msg, args) => {
			if (!args || !args.includes(";")) {
				return msg.send(`Usage: poll question; option1, option2, option3`);
			}
			const [question, optionsRaw] = args.split(";").map(s => s.trim());
			if (!question || !optionsRaw)
				return msg.send(en.plugin.groups.poll.no_question);
			const options = optionsRaw
				.split(",")
				.map(opt => opt.trim())
				.filter(Boolean);
			if (options.length < 2) return msg.send(en.plugin.groups.poll.min_options);
			await msg.sendMessage(msg.chat, {
				poll: { name: question, values: options, selectableCount: 1 },
			});
		},
	},
	{
		pattern: "leave",
		fromMe: true,
		isGroup: true,
		desc: "Leave a group",
		type: "group",
		handler: async msg => {
			return await msg.groupLeave(msg.chat);
		},
	},
	{
		pattern: "requests",
		fromMe: false,
		isGroup: true,
		desc: "Get group join requests",
		type: "group",
		handler: async msg => {
			if (!msg.isAdmin) return msg.send(en.sender_not_admin);
			if (!msg.isBotAdmin) return msg.send(en.bot_not_admin);
			const requests = await msg.groupRequestParticipantsList(msg.chat);
			if (!requests || requests.length === 0) {
				return msg.send(en.plugin.groups.requests.none);
			}
			const participants = requests.map(p => p.id);
			return await msg.send(
				`Join requests: ${participants.length}\n\n` +
					participants.map(p => `@${p.split("@")[0]}`).join("\n"),
				{
					mentions: participants,
					to: msg.chat,
				}
			);
		},
	},
	{
		pattern: "accept",
		fromMe: false,
		isGroup: true,
		desc: "Approve a group join request",
		type: "group",
		handler: async msg => {
			if (!msg.isAdmin) return msg.send(en.sender_not_admin);
			if (!msg.isBotAdmin) return msg.send(en.bot_not_admin);
			const requests = await msg.groupRequestParticipantsList(msg.chat);
			if (!requests || requests.length === 0) {
				return msg.send(en.plugin.groups.requests.none);
			}
			const participants = requests.map(p => p.id);
			await msg.groupRequestParticipantsUpdate(msg.chat, participants, "approve");
			return await msg.send(
				`Approved members: ${participants
					.map(p => `@${p.split("@")[0]}`)
					.join(", ")}`,
				{
					mentions: participants,
					to: msg.chat,
				}
			);
		},
	},
	{
		pattern: "reject",
		fromMe: false,
		isGroup: true,
		desc: "Reject all group join requests",
		type: "group",
		handler: async msg => {
			if (!msg.isAdmin) return msg.send(en.sender_not_admin);
			if (!msg.isBotAdmin) return msg.send(en.bot_not_admin);
			const requests = await msg.groupRequestParticipantsList(msg.chat);
			if (!requests || requests.length === 0) {
				return msg.send(en.plugin.groups.requests.none);
			}
			const participants = requests.map(p => p.id);
			await msg.groupRequestParticipantsUpdate(msg.chat, participants, "reject");
			return await msg.send(
				`Rejected members: ${participants
					.map(p => `@${p.split("@")[0]}`)
					.join(", ")}`,
				{
					mentions: participants,
					to: msg.chat,
				}
			);
		},
	},
] satisfies CommandModule[];
