/**
 * Upload progress component with detailed progress tracking
 */

import { AlertCircle, CheckCircle, Clock, Loader2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { formatFileSize } from "~/lib/file-validation";
import { uploadService } from "~/lib/upload.client";
import { cn } from "~/lib/utils";

export interface UploadProgressProps {
	totalFiles: number;
	completedFiles: number;
	failedFiles: number;
	currentFile?: string;
	overallProgress?: number;
	uploadSpeed?: number;
	timeRemaining?: number;
	className?: string;
}

export function UploadProgress({
	totalFiles,
	completedFiles,
	failedFiles,
	currentFile,
	overallProgress = 0,
	uploadSpeed = 0,
	timeRemaining = 0,
	className,
}: UploadProgressProps) {
	const inProgress = totalFiles - completedFiles - failedFiles;
	const hasErrors = failedFiles > 0;
	const isComplete = completedFiles === totalFiles && failedFiles === 0;
	const isUploading = inProgress > 0;

	const getStatusIcon = () => {
		if (isComplete) {
			return <CheckCircle className="h-5 w-5 text-green-500" />;
		}
		if (hasErrors && !isUploading) {
			return <AlertCircle className="h-5 w-5 text-red-500" />;
		}
		if (isUploading) {
			return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
		}
		return <Upload className="h-5 w-5 text-gray-400" />;
	};

	const getStatusText = () => {
		if (isComplete) {
			return "Upload complete";
		}
		if (hasErrors && !isUploading) {
			return `${failedFiles} file${failedFiles > 1 ? "s" : ""} failed`;
		}
		if (isUploading) {
			return "Uploading files...";
		}
		return "Ready to upload";
	};

	const getStatusColor = () => {
		if (isComplete) return "text-green-600";
		if (hasErrors) return "text-red-600";
		if (isUploading) return "text-blue-600";
		return "text-gray-600";
	};

	return (
		<div
			className={cn(
				"bg-white border rounded-lg p-4 shadow-sm",
				hasErrors && !isUploading
					? "border-red-200 bg-red-50"
					: "border-gray-200",
				className,
			)}
		>
			{/* Header */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center space-x-3">
					{getStatusIcon()}
					<div>
						<p className={cn("font-medium", getStatusColor())}>
							{getStatusText()}
						</p>
						<p className="text-sm text-gray-500">
							{completedFiles} of {totalFiles} files completed
						</p>
					</div>
				</div>

				{/* Speed and time remaining */}
				{isUploading && uploadSpeed > 0 && (
					<div className="text-right">
						<p className="text-sm text-gray-600">
							{uploadService.formatSpeed(uploadSpeed)}
						</p>
						{timeRemaining > 0 && (
							<p className="text-xs text-gray-500 flex items-center">
								<Clock className="h-3 w-3 mr-1" />
								{uploadService.formatTimeRemaining(timeRemaining)}
							</p>
						)}
					</div>
				)}
			</div>

			{/* Progress bar */}
			<div className="mb-4">
				<div className="flex items-center justify-between text-sm text-gray-600 mb-2">
					<span>Overall progress</span>
					<span>{Math.round(overallProgress)}%</span>
				</div>
				<div className="w-full bg-gray-200 rounded-full h-2">
					<div
						className={cn(
							"h-2 rounded-full transition-all duration-300",
							isComplete
								? "bg-green-500"
								: hasErrors && !isUploading
									? "bg-red-500"
									: "bg-blue-500",
						)}
						style={{ width: `${overallProgress}%` }}
					/>
				</div>
			</div>

			{/* Current file */}
			{currentFile && isUploading && (
				<div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
					<p className="text-sm text-blue-800">
						Currently uploading:{" "}
						<span className="font-medium">{currentFile}</span>
					</p>
				</div>
			)}

			{/* File status summary */}
			<div className="grid grid-cols-3 gap-4 text-center">
				<div className="space-y-1">
					<p className="text-2xl font-bold text-green-600">{completedFiles}</p>
					<p className="text-xs text-gray-500">Completed</p>
				</div>
				<div className="space-y-1">
					<p className="text-2xl font-bold text-blue-600">{inProgress}</p>
					<p className="text-xs text-gray-500">In Progress</p>
				</div>
				<div className="space-y-1">
					<p className="text-2xl font-bold text-red-600">{failedFiles}</p>
					<p className="text-xs text-gray-500">Failed</p>
				</div>
			</div>
		</div>
	);
}

/**
 * Simple progress bar component
 */
export interface ProgressBarProps {
	progress: number;
	className?: string;
	showPercentage?: boolean;
	color?: "blue" | "green" | "red" | "yellow";
	size?: "sm" | "md" | "lg";
}

export function ProgressBar({
	progress,
	className,
	showPercentage = true,
	color = "blue",
	size = "md",
}: ProgressBarProps) {
	const sizeClasses = {
		sm: "h-1",
		md: "h-2",
		lg: "h-3",
	};

	const colorClasses = {
		blue: "bg-blue-500",
		green: "bg-green-500",
		red: "bg-red-500",
		yellow: "bg-yellow-500",
	};

	return (
		<div className={cn("w-full", className)}>
			{showPercentage && (
				<div className="flex items-center justify-between text-sm text-gray-600 mb-1">
					<span>Progress</span>
					<span>{Math.round(progress)}%</span>
				</div>
			)}
			<div className={cn("w-full bg-gray-200 rounded-full", sizeClasses[size])}>
				<div
					className={cn(
						"rounded-full transition-all duration-300",
						sizeClasses[size],
						colorClasses[color],
					)}
					style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
				/>
			</div>
		</div>
	);
}

/**
 * Detailed file upload progress with individual file tracking
 */
export interface DetailedUploadProgressProps {
	uploads: Array<{
		id: string;
		fileName: string;
		fileSize: number;
		progress: number;
		status: "pending" | "uploading" | "completed" | "failed";
		error?: string;
		speed?: number;
	}>;
	className?: string;
}

export function DetailedUploadProgress({
	uploads,
	className,
}: DetailedUploadProgressProps) {
	const totalFiles = uploads.length;
	const completedFiles = uploads.filter((u) => u.status === "completed").length;
	const failedFiles = uploads.filter((u) => u.status === "failed").length;
	const uploadingFiles = uploads.filter((u) => u.status === "uploading");

	const overallProgress =
		totalFiles > 0
			? uploads.reduce((sum, upload) => sum + upload.progress, 0) / totalFiles
			: 0;

	const totalSpeed = uploadingFiles.reduce(
		(sum, upload) => sum + (upload.speed || 0),
		0,
	);

	return (
		<div className={cn("space-y-4", className)}>
			{/* Overall progress */}
			<UploadProgress
				totalFiles={totalFiles}
				completedFiles={completedFiles}
				failedFiles={failedFiles}
				currentFile={uploadingFiles[0]?.fileName}
				overallProgress={overallProgress}
				uploadSpeed={totalSpeed}
			/>

			{/* Individual file progress */}
			{uploads.length > 0 && (
				<div className="space-y-2">
					<h4 className="font-medium text-gray-900">File Details</h4>
					<div className="space-y-2 max-h-64 overflow-y-auto">
						{uploads.map((upload) => (
							<div
								key={upload.id}
								className={cn(
									"flex items-center justify-between p-3 rounded-lg border",
									upload.status === "completed"
										? "bg-green-50 border-green-200"
										: upload.status === "failed"
											? "bg-red-50 border-red-200"
											: upload.status === "uploading"
												? "bg-blue-50 border-blue-200"
												: "bg-gray-50 border-gray-200",
								)}
							>
								<div className="flex items-center space-x-3 flex-1 min-w-0">
									{upload.status === "completed" && (
										<CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
									)}
									{upload.status === "failed" && (
										<AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
									)}
									{upload.status === "uploading" && (
										<Loader2 className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0" />
									)}
									{upload.status === "pending" && (
										<div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
									)}

									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-gray-900 truncate">
											{upload.fileName}
										</p>
										<p className="text-xs text-gray-500">
											{formatFileSize(upload.fileSize)}
											{upload.speed && upload.status === "uploading" && (
												<> • {uploadService.formatSpeed(upload.speed)}</>
											)}
										</p>
										{upload.error && (
											<p className="text-xs text-red-600 mt-1">
												{upload.error}
											</p>
										)}
									</div>
								</div>

								<div className="flex items-center space-x-2">
									<span className="text-xs text-gray-500 w-10 text-right">
										{Math.round(upload.progress)}%
									</span>
									<div className="w-16">
										<ProgressBar
											progress={upload.progress}
											showPercentage={false}
											color={
												upload.status === "completed"
													? "green"
													: upload.status === "failed"
														? "red"
														: "blue"
											}
											size="sm"
										/>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
