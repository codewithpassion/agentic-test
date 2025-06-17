export type FileContent =
	| ReadableStream
	| ArrayBuffer
	| ArrayBufferView
	| string
	| null
	| Blob;

export type PhotoFile = {
	key?: string;
	id: string;
	name: string;
	url?: string;
	type: string;
	content?: FileContent;
	competitionId: string;
	categoryId: string;
	userId: string;
};

function stripExtension(filename: string): string {
	return filename.split(".").slice(0, -1).join(".");
}

function getExtension(filename: string): string {
	return filename.split(".").pop() || "";
}

export class PhotoFileStore {
	constructor(private bucket: R2Bucket) {}

	private getFileKey(file: PhotoFile): string {
		if (file.key) {
			return file.key;
		}
		const extension = getExtension(file.name);
		return `competitions/${file.competitionId}/photos/${file.id}.${extension}`;
	}

	async create(file: PhotoFile): Promise<PhotoFile> {
		if (file.content) {
			const key = this.getFileKey(file);
			await this.bucket.put(key, file.content, {
				httpMetadata: {
					contentType: file.type,
				},
				customMetadata: {
					type: file.type,
					name: file.name,
					userId: file.userId,
					competitionId: file.competitionId,
					categoryId: file.categoryId,
					created_at: new Date().toISOString(),
				},
			});
			return { ...file, key };
		}
		throw new Error("No content provided");
	}

	async listByCompetition(competitionId: string): Promise<PhotoFile[]> {
		const files = await this.bucket.list({
			prefix: `competitions/${competitionId}/photos/`,
			include: ["customMetadata"],
		});

		return files.objects.map((file) => ({
			key: file.key,
			id: this.extractPhotoIdFromKey(file.key),
			name: file.customMetadata?.name || "",
			type: file.customMetadata?.type || "",
			competitionId: file.customMetadata?.competitionId || "",
			categoryId: file.customMetadata?.categoryId || "",
			userId: file.customMetadata?.userId || "",
		}));
	}

	async listByUser(
		userId: string,
		competitionId?: string,
	): Promise<PhotoFile[]> {
		const prefix = competitionId
			? `competitions/${competitionId}/photos/`
			: "competitions/";

		const files = await this.bucket.list({
			prefix,
			include: ["customMetadata"],
		});

		return files.objects
			.filter((file) => file.customMetadata?.userId === userId)
			.map((file) => ({
				key: file.key,
				id: this.extractPhotoIdFromKey(file.key),
				name: file.customMetadata?.name || "",
				type: file.customMetadata?.type || "",
				competitionId: file.customMetadata?.competitionId || "",
				categoryId: file.customMetadata?.categoryId || "",
				userId: file.customMetadata?.userId || "",
			}));
	}

	async getById(
		photoId: string,
		competitionId: string,
	): Promise<PhotoFile | undefined> {
		// Try to find the file by reconstructing possible keys
		const extensions = ["jpg", "jpeg", "png"];

		for (const ext of extensions) {
			const key = `competitions/${competitionId}/photos/${photoId}.${ext}`;
			const file = await this.bucket.get(key);

			if (file) {
				return {
					key,
					id: photoId,
					name: file.customMetadata?.name || "",
					type: file.customMetadata?.type || "",
					competitionId: file.customMetadata?.competitionId || "",
					categoryId: file.customMetadata?.categoryId || "",
					userId: file.customMetadata?.userId || "",
				};
			}
		}

		return undefined;
	}

	async delete(file: PhotoFile): Promise<void> {
		await this.bucket.delete(this.getFileKey(file));
	}

	async getContent(file: PhotoFile) {
		return this.bucket.get(this.getFileKey(file));
	}

	async getWithContentById(
		photoId: string,
		competitionId: string,
	): Promise<{ file: PhotoFile; content: R2ObjectBody | null }> {
		const file = await this.getById(photoId, competitionId);
		if (!file) {
			throw new Error("File not found");
		}
		if (!file.key) {
			throw new Error("File key is missing");
		}
		const content = await this.bucket.get(file.key);
		return { file, content };
	}

	private extractPhotoIdFromKey(key: string): string {
		// Extract ID from key like "competitions/comp-id/photos/photo-id.jpg"
		const parts = key.split("/");
		const filename = parts[parts.length - 1];
		return stripExtension(filename);
	}

	getPublicUrl(file: PhotoFile): string {
		const key = this.getFileKey(file);
		return `/api/photos/serve/${encodeURIComponent(key)}`;
	}
}
