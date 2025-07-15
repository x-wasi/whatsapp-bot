import { CommandModule } from "@types";


const codingQuotes = [
  "Code never lies, comments sometimes do.",
  "Fix the cause, not the symptom.",
  "First, solve the problem. Then, write the code.",
  "Experience is the name everyone gives to their bugs.",
  "Clean code always looks like it was written by someone who cares.",
  "Programming isn't about what you know; it's about what you can figure out.",
  "Talk is cheap. Show me the code.",
  "The best error message is the one that never shows up.",
  "Code is like humor. When you have to explain it, it’s bad.",
  "A good programmer is someone who always looks both ways before crossing a one-way street."
];

// Choose a random quote
function getRandomQuote() {
  const index = Math.floor(Math.random() * codingQuotes.length);
  return codingQuotes[index];
}

function getFormattedBio(): string {
  const now = new Date();
  const date = now.toLocaleDateString("en-PK");
  const time = now.toLocaleTimeString("en-PK");
  const quote = getRandomQuote();
  return `${quote} | 📅 ${date} | 🕒 ${time} | ⚡ Powered by Xstro Bot`;
}

export default [
  {
    pattern: "autobio",
    fromMe: true,
    desc: "Update bot bio with a random coding quote",
    type: "owner",
    handler: async msg => {
      try {
        const newBio = getFormattedBio();
        await msg.updateProfileStatus(newBio);
        await msg.send(`✅ Bio updated:\n${newBio}`);
      } catch (err) {
        console.error("❌ Failed to update bio:", err);
        await msg.send("❌ Failed to update bio.");
      }
    }
  }
] satisfies CommandModule[];
