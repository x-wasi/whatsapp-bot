import { fork } from "child_process";
import { Red, Yellow } from "./lib/utils/console";

let restarting = false;

const start = () => {
	const child = fork("./src/socket");

	child.on("exit", (code, signal) => {
		Red(`Error: ${code}: Signal: ${signal}`);
		if (!restarting) {
			Yellow("Restarting...");
			start();
		}
	});

	child.on("error", err => {
		Red("Error:", err);
		if (!restarting) {
			Red("Restarting due to error...");
			start();
		}
	});
};

start();
