import { readFile } from "fs/promises";
import path from "path";
import { cwd } from "process";

export * from "./media";
export * from "./misc";
export * from "./lang";

export const logo = await readFile(
	path.join(cwd(), "lib", "resources", "media", "bot", "social.png")
);
