/**
 * Upload zone component with drag-and-drop support
 */

import { AlertCircle, Image, Upload } from "lucide-react";
import { type DragEvent, useCallback, useRef, useState } from "react";
import {
	type FileValidationRules,
	formatFileSize,
	validateFiles,
} from "~/lib/file-validation";
import { cn } from "~/lib/utils";

export interface UploadZoneProps {
	onFilesSelected: (files: File[]) => void;
	maxFiles?: number;
	acceptedTypes?: string[];
	maxFileSize?: number;
	disabled?: boolean;
	multiple?: boolean;
	className?: string;
	validationRules?: FileValidationRules;
}

export function UploadZone({
	onFilesSelected,
	maxFiles = 10,
	acceptedTypes = ["image/jpeg", "image/png"],
	maxFileSize = 10 * 1024 * 1024, // 10MB
	disabled = false,
	multiple = true,
	className,
	validationRules,
}: UploadZoneProps) {
	const [isDragOver, setIsDragOver] = useState(false);
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});
	const fileInputRef = useRef<HTMLInputElement>(null);

	const rules: FileValidationRules = validationRules || {
		maxSize: maxFileSize,
		allowedTypes: acceptedTypes,
		minDimensions: { width: 800, height: 600 },
	};

	const handleDragEnter = useCallback(
		(e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			if (!disabled) {
				setIsDragOver(true);
			}
		},
		[disabled],
	);

	const handleDragLeave = useCallback((e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		// Only set isDragOver to false if we're leaving the drop zone entirely
		if (!e.currentTarget.contains(e.relatedTarget as Node)) {
			setIsDragOver(false);
		}
	}, []);

	const handleDragOver = useCallback((e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDrop = useCallback(
		async (e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragOver(false);

			if (disabled) return;

			const droppedFiles = Array.from(e.dataTransfer.files);
			await processFiles(droppedFiles);
		},
		[disabled],
	);

	const handleFileInput = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			if (disabled) return;

			const selectedFiles = Array.from(e.target.files || []);
			await processFiles(selectedFiles);

			// Clear the input so the same file can be selected again
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		},
		[disabled],
	);

	const processFiles = useCallback(
		async (files: File[]) => {
			// Limit number of files
			const limitedFiles = files.slice(0, maxFiles);

			// Validate files
			const validation = await validateFiles(limitedFiles, rules);
			setValidationErrors(validation.errors);

			// Only pass valid files to parent
			const validFiles = limitedFiles.filter(
				(file) => !validation.errors[file.name],
			);

			if (validFiles.length > 0) {
				onFilesSelected(validFiles);
			}
		},
		[maxFiles, rules, onFilesSelected],
	);

	const handleClick = useCallback(() => {
		if (!disabled && fileInputRef.current) {
			fileInputRef.current.click();
		}
	}, [disabled]);

	const hasErrors = Object.keys(validationErrors).length > 0;

	return (
		<div className={cn("relative", className)}>
			<button
				type="button"
				className={cn(
					"w-full border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
					"hover:border-primary/50 hover:bg-primary/5",
					"focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
					isDragOver &&
						!disabled &&
						"border-primary bg-primary/10 scale-[1.02]",
					disabled && "opacity-50 cursor-not-allowed bg-gray-50",
					hasErrors && "border-red-300 bg-red-50/50",
					!isDragOver && !hasErrors && "border-gray-300",
				)}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				onClick={handleClick}
				disabled={disabled}
				aria-label="Upload files"
			>
				<input
					ref={fileInputRef}
					type="file"
					className="sr-only"
					multiple={multiple}
					accept={acceptedTypes.join(",")}
					onChange={handleFileInput}
					disabled={disabled}
				/>

				<div className="flex flex-col items-center space-y-4">
					{isDragOver ? (
						<div className="animate-bounce">
							<Image className="h-12 w-12 text-primary" />
						</div>
					) : (
						<Upload
							className={cn(
								"h-12 w-12",
								hasErrors ? "text-red-400" : "text-gray-400",
							)}
						/>
					)}

					<div className="space-y-2">
						<p
							className={cn(
								"text-lg font-medium",
								hasErrors ? "text-red-600" : "text-gray-900",
							)}
						>
							{isDragOver
								? "Drop files here"
								: hasErrors
									? "Please fix errors and try again"
									: "Drag & drop files here"}
						</p>

						<p
							className={cn(
								"text-sm",
								hasErrors ? "text-red-500" : "text-gray-500",
							)}
						>
							or{" "}
							<span className="font-medium text-primary underline">
								click to browse
							</span>
						</p>
					</div>

					<div className="text-xs text-gray-400 space-y-1">
						<p>
							Accepted:{" "}
							{acceptedTypes
								.map((type) => type.split("/")[1].toUpperCase())
								.join(", ")}
						</p>
						<p>Max size: {formatFileSize(maxFileSize)} per file</p>
						{multiple && <p>Max files: {maxFiles}</p>}
					</div>
				</div>
			</button>

			{/* Validation Errors */}
			{hasErrors && (
				<div className="mt-4 space-y-2">
					{Object.entries(validationErrors).map(([fileName, error]) => (
						<div
							key={fileName}
							className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg"
						>
							<AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
							<div className="text-sm">
								<p className="font-medium text-red-800">{fileName}</p>
								<p className="text-red-600">{error}</p>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
