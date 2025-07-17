import { spawn } from "child_process";

export function runFFmpeg(args: string[]): Promise<void> {
	return new Promise((resolve, reject) => {
		const ffmpeg = spawn("ffmpeg", args);
		ffmpeg.stderr.pipe(process.stderr);
		ffmpeg.stdout.pipe(process.stdout);
		ffmpeg.on("error", reject);
		ffmpeg.on("close", code => {
			if (code === 0) resolve();
			else reject(new Error(`FFmpeg exited with code ${code}`));
		});
	});
}
