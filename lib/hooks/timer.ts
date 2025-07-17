export function startClockAlignedScheduler(callback: () => void): void {
	const run = () => {
		callback();
		const now = new Date();
		const delay = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
		setTimeout(run, delay);
	};
	run();
}

export function getCurrentTimeString(): string {
	const now = new Date();
	let hours = now.getHours();
	const minutes = now.getMinutes();
	const period = hours >= 12 ? "pm" : "am";
	hours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
	return `${hours}:${minutes.toString().padStart(2, "0")}${period}`;
}
