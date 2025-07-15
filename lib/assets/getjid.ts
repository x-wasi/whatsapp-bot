// approve it if u thing this good && IGNORE IT 


import { CommandModule } from "@types";

export default [
  {
    pattern: "jid",
    fromMe: true,
    desc: "Debug JID structure",
    type: "debug",
    handler: async msg => {
      console.log("📦 Full msg object:", JSON.stringify(msg, null, 2)); // 👈 dump it all

      const chatId =
        msg.chat ||
        msg.jid ||
        msg.id?.remote ||
        msg.key?.remoteJid ||
        msg.key?.participant ||
        "❌ Chat JID not found";

      await msg.send(`🆔 Chat JID: ${chatId}`);
    }
  }
] satisfies CommandModule[];
