/**
 * Image preview component with upload progress and error handling
 */

import { AlertCircle, CheckCircle, Eye, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatFileSize } from "~/lib/file-validation";
import { generateThumbnail, getImageDimensions } from "~/lib/image-utils";
import { cn } from "~/lib/utils";

export interface ImagePreviewProps {
	file: File;
	onRemove: () => void;
	uploadProgress?: number;
	error?: string;
	isUploading?: boolean;
	isCompleted?: boolean;
	className?: string;
}

export function ImagePreview({
	file,
	onRemove,
	uploadProgress,
	error,
	isUploading = false,
	isCompleted = false,
	className,
}: ImagePreviewProps) {
	const [thumbnail, setThumbnail] = useState<string | null>(null);
	const [dimensions, setDimensions] = useState<{
		width: number;
		height: number;
	} | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [imageError, setImageError] = useState<string | null>(null);

	// Generate thumbnail and get dimensions
	useEffect(() => {
		let mounted = true;

		const loadImageData = async () => {
			try {
				setIsLoading(true);
				setImageError(null);

				// Generate thumbnail
				const thumbnailUrl = await generateThumbnail(file, {
					maxWidth: 200,
					maxHeight: 200,
					quality: 0.8,
				});

				// Get dimensions
				const imageDimensions = await getImageDimensions(file);

				if (mounted) {
					setThumbnail(thumbnailUrl);
					setDimensions(imageDimensions);
				}
			} catch (err) {
				if (mounted) {
					setImageError(
						err instanceof Error ? err.message : "Failed to load image",
					);
				}
			} finally {
				if (mounted) {
					setIsLoading(false);
				}
			}
		};

		loadImageData();

		return () => {
			mounted = false;
		};
	}, [file]);

	const getStatusIcon = () => {
		if (error || imageError) {
			return <AlertCircle className="h-4 w-4 text-red-500" />;
		}
		if (isCompleted) {
			return <CheckCircle className="h-4 w-4 text-green-500" />;
		}
		if (isUploading) {
			return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
		}
		return null;
	};

	const getStatusText = () => {
		if (error) return error;
		if (imageError) return imageError;
		if (isCompleted) return "Upload complete";
		if (isUploading) return "Uploading...";
		return "Ready to upload";
	};

	const getStatusColor = () => {
		if (error || imageError) return "text-red-600";
		if (isCompleted) return "text-green-600";
		if (isUploading) return "text-blue-600";
		return "text-gray-600";
	};

	return (
		<div
			className={cn(
				"relative bg-white border rounded-lg p-4 shadow-sm",
				error || imageError ? "border-red-200 bg-red-50" : "border-gray-200",
				className,
			)}
		>
			{/* Remove button */}
			<button
				onClick={onRemove}
				className="absolute top-2 right-2 z-10 p-1 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
				type="button"
			>
				<X className="h-4 w-4 text-gray-500" />
			</button>

			<div className="flex space-x-4">
				{/* Thumbnail */}
				<div className="flex-shrink-0">
					<div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
						{isLoading ? (
							<Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
						) : imageError ? (
							<AlertCircle className="h-6 w-6 text-red-400" />
						) : thumbnail ? (
							<img
								src={thumbnail}
								alt={file.name}
								className="w-full h-full object-cover"
							/>
						) : (
							<Eye className="h-6 w-6 text-gray-400" />
						)}
					</div>
				</div>

				{/* File info */}
				<div className="flex-1 min-w-0">
					<div className="flex items-start justify-between">
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-gray-900 truncate">
								{file.name}
							</p>
							<div className="flex items-center space-x-2 mt-1">
								<p className="text-xs text-gray-500">
									{formatFileSize(file.size)}
								</p>
								{dimensions && (
									<p className="text-xs text-gray-500">
										{dimensions.width} × {dimensions.height}
									</p>
								)}
							</div>
						</div>

						{/* Status icon */}
						<div className="ml-2">{getStatusIcon()}</div>
					</div>

					{/* Status text */}
					<p className={cn("text-xs mt-2", getStatusColor())}>
						{getStatusText()}
					</p>

					{/* Upload progress */}
					{isUploading && typeof uploadProgress === "number" && (
						<div className="mt-2">
							<div className="flex items-center justify-between text-xs text-gray-600 mb-1">
								<span>Uploading</span>
								<span>{uploadProgress}%</span>
							</div>
							<div className="w-full bg-gray-200 rounded-full h-1.5">
								<div
									className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
									style={{ width: `${uploadProgress}%` }}
								/>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

/**
 * Multiple image previews container
 */
export interface ImagePreviewListProps {
	files: Array<{
		file: File;
		uploadProgress?: number;
		error?: string;
		isUploading?: boolean;
		isCompleted?: boolean;
	}>;
	onRemoveFile: (index: number) => void;
	className?: string;
}

export function ImagePreviewList({
	files,
	onRemoveFile,
	className,
}: ImagePreviewListProps) {
	if (files.length === 0) {
		return null;
	}

	return (
		<div className={cn("space-y-3", className)}>
			{files.map((fileData, index) => (
				<ImagePreview
					key={`${fileData.file.name}-${index}`}
					file={fileData.file}
					uploadProgress={fileData.uploadProgress}
					error={fileData.error}
					isUploading={fileData.isUploading}
					isCompleted={fileData.isCompleted}
					onRemove={() => onRemoveFile(index)}
				/>
			))}
		</div>
	);
}
