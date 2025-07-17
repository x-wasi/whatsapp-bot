import { CommandModule } from "@types";

async function removeBg(blob: Blob): Promise<ArrayBuffer> {
	const formData = new FormData();
	formData.append("size", "auto");
	formData.append("image_file", blob);

	const response = await fetch("https://api.remove.bg/v1.0/removebg", {
		method: "POST",
		headers: { "X-Api-Key": "rzhLwHssmJpmxPQ9bNp9nSyd" },
		body: formData,
	});

	if (response.ok) {
		return await response.arrayBuffer();
	}

	throw new Error(`${response.status}: ${response.statusText}`);
}

export default {
	pattern: "rmbg",
	fromMe: false,
	isGroup: false,
	desc: "Remove background of an image",
	type: "misc",
	handler: async msg => {
		if (!msg?.quoted?.image) return msg.send("Reply to an image");

		const image = await msg.download(msg.quoted);
		let res = await removeBg(new Blob([image], { type: "image/png" }));
		return await msg.send(Buffer.from(res));
	},
} satisfies CommandModule;
