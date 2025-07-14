import type { CacheStore } from "baileys";

export default (): CacheStore => {
	const store = new Map<string, unknown>();

	return {
		get<T>(key: string): T | undefined {
			const value = store.get(key) as T | undefined;
			return value;
		},

		set<T>(key: string, value: T): void {
			store.set(key, value);
		},

		del(key: string): void {
			store.delete(key);
		},

		flushAll(): void {
			store.clear();
		},
	};
};
