import { request, Dispatcher } from "undici";

type Headers = Record<string, string>;

interface RequestConfig {
	headers?: Headers;
	timeout?: number;
	maxRedirects?: number;
	followRedirects?: boolean;
	throwOnError?: boolean;
	retries?: number;
	retryDelay?: number;
}

interface RequestContext {
	url: string;
	redirectCount: number;
	visitedUrls: Set<string>;
}

const defaultHeaders: Headers = {
	"User-Agent":
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
	Accept: "application/json, text/plain, */*",
	DNT: "1",
	Connection: "keep-alive",
	"Accept-Encoding": "gzip, deflate, br",
	"Accept-Language": "en-US,en;q=0.9",
};

const defaultConfig: Required<RequestConfig> = {
	headers: {},
	timeout: 30000,
	maxRedirects: 10,
	followRedirects: true,
	throwOnError: true,
	retries: 3,
	retryDelay: 1000,
};

class HttpClient {
	private mergeConfig(config: RequestConfig = {}): Required<RequestConfig> {
		return {
			...defaultConfig,
			...config,
			headers: { ...defaultHeaders, ...config.headers },
		};
	}

	private async handleRedirect(
		response: Dispatcher.ResponseData,
		context: RequestContext,
		config: Required<RequestConfig>
	): Promise<string | null> {
		if (!config.followRedirects) return null;

		const statusCode = response.statusCode;
		const isRedirect = [301, 302, 303, 307, 308].includes(statusCode);

		if (!isRedirect) return null;

		const location = response.headers.location as string;
		if (!location) return null;

		if (context.redirectCount >= config.maxRedirects) {
			throw new Error(`Max redirects (${config.maxRedirects}) exceeded`);
		}

		// Resolve relative URLs
		const redirectUrl = new URL(location, context.url).toString();

		// Prevent redirect loops
		if (context.visitedUrls.has(redirectUrl)) {
			throw new Error(`Redirect loop detected: ${redirectUrl}`);
		}

		return redirectUrl;
	}

	private async executeRequest(
		url: string,
		options: Dispatcher.RequestOptions,
		config: Required<RequestConfig>,
		context: RequestContext
	): Promise<Dispatcher.ResponseData> {
		context.visitedUrls.add(url);

		const response = await request(url, {
			...options,
			headers: config.headers,
			headersTimeout: config.timeout,
			bodyTimeout: config.timeout,
		});

		const redirectUrl = await this.handleRedirect(response, context, config);

		if (redirectUrl) {
			context.url = redirectUrl;
			context.redirectCount++;

			// For 303, always use GET
			const method = response.statusCode === 303 ? "GET" : options.method;
			const body = response.statusCode === 303 ? undefined : options.body;

			return this.executeRequest(
				redirectUrl,
				{ ...options, method, body },
				config,
				context
			);
		}

		return response;
	}

	private async requestWithRetry<T>(
		url: string,
		options: Dispatcher.RequestOptions,
		config: Required<RequestConfig>,
		processor: (response: Dispatcher.ResponseData) => Promise<T>
	): Promise<T> {
		let lastError: Error | null = null;

		for (let attempt = 0; attempt <= config.retries; attempt++) {
			try {
				const context: RequestContext = {
					url,
					redirectCount: 0,
					visitedUrls: new Set(),
				};

				const response = await this.executeRequest(url, options, config, context);

				if (config.throwOnError && response.statusCode >= 400) {
					const errorBody = await response.body.text();
					throw new Error(`HTTP ${response.statusCode}: ${errorBody}`);
				}

				return await processor(response);
			} catch (error) {
				lastError = error as Error;

				if (attempt < config.retries) {
					await new Promise(resolve => setTimeout(resolve, config.retryDelay));
				}
			}
		}

		throw lastError;
	}

	async get<T = any>(url: string, config: RequestConfig = {}): Promise<T> {
		const mergedConfig = this.mergeConfig(config);

		return this.requestWithRetry(
			url,
			//@ts-ignore
			{ method: "GET" },
			mergedConfig,
			async response => response.body.json() as Promise<T>
		);
	}

	async post<T = any>(
		url: string,
		data: any,
		config: RequestConfig = {}
	): Promise<T> {
		const mergedConfig = this.mergeConfig({
			...config,
			headers: {
				"Content-Type": "application/json",
				...config.headers,
			},
		});

		return this.requestWithRetry(
			url,
			//@ts-ignore
			{
				method: "POST",
				body: JSON.stringify(data),
			},
			mergedConfig,
			async response => response.body.json() as Promise<T>
		);
	}

	async put<T = any>(
		url: string,
		data: any,
		config: RequestConfig = {}
	): Promise<T> {
		const mergedConfig = this.mergeConfig({
			...config,
			headers: {
				"Content-Type": "application/json",
				...config.headers,
			},
		});

		return this.requestWithRetry(
			url,
			//@ts-ignore
			{
				method: "PUT",
				body: JSON.stringify(data),
			},
			mergedConfig,
			async response => response.body.json() as Promise<T>
		);
	}

	async delete<T = any>(url: string, config: RequestConfig = {}): Promise<T> {
		const mergedConfig = this.mergeConfig(config);

		return this.requestWithRetry(
			url,
			//@ts-ignore
			{ method: "DELETE" },
			mergedConfig,
			async response => response.body.json() as Promise<T>
		);
	}

	async getBuffer(url: string, config: RequestConfig = {}): Promise<Buffer> {
		const mergedConfig = this.mergeConfig({
			...config,
			headers: {
				Accept: "*/*",
				...config.headers,
			},
		});

		return this.requestWithRetry(
			url,
			//@ts-ignore
			{ method: "GET" },
			mergedConfig,
			async response => {
				const chunks: Uint8Array[] = [];
				for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
					chunks.push(chunk);
				}
				return Buffer.concat(chunks);
			}
		);
	}

	async getText(url: string, config: RequestConfig = {}): Promise<string> {
		const mergedConfig = this.mergeConfig({
			...config,
			headers: {
				Accept: "text/plain, */*",
				...config.headers,
			},
		});

		return this.requestWithRetry(
			url,
			//@ts-ignore
			{ method: "GET" },
			mergedConfig,
			async response => response.body.text()
		);
	}

	async head(url: string, config: RequestConfig = {}): Promise<Headers> {
		const mergedConfig = this.mergeConfig(config);

		return this.requestWithRetry(
			url,
			//@ts-ignore
			{ method: "HEAD" },
			mergedConfig,
			async response => response.headers as Headers
		);
	}
}

const httpClient = new HttpClient();

export const get = httpClient.get.bind(httpClient);
export const post = httpClient.post.bind(httpClient);
export const put = httpClient.put.bind(httpClient);
export const del = httpClient.delete.bind(httpClient);
export const getBuffer = httpClient.getBuffer.bind(httpClient);
export const getText = httpClient.getText.bind(httpClient);
export const head = httpClient.head.bind(httpClient);

export { HttpClient };
export type { RequestConfig, Headers };
