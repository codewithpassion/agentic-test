/**
 * Individual photo metadata form card component
 */

import { zodResolver } from "@hookform/resolvers/zod";
import {
	Calendar,
	Camera,
	ChevronDown,
	ChevronUp,
	Save,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "~/lib/utils";
import {
	CategorySelect,
	type CategoryWithSubmissionInfo,
} from "./category-select";

// Validation schema for individual photo metadata
const photoMetadataSchema = z.object({
	categoryId: z.string().uuid("Please select a category"),
	title: z
		.string()
		.min(3, "Title must be at least 3 characters")
		.max(100, "Title must not exceed 100 characters"),
	description: z
		.string()
		.min(10, "Description must be at least 10 characters")
		.max(500, "Description must not exceed 500 characters"),
	dateTaken: z
		.string()
		.min(1, "Date taken is required")
		.refine((date) => {
			const selectedDate = new Date(date);
			const today = new Date();
			today.setHours(23, 59, 59, 999);
			return selectedDate <= today;
		}, "Date cannot be in the future"),
	location: z
		.string()
		.min(2, "Location must be at least 2 characters")
		.max(100, "Location must not exceed 100 characters"),
	// Optional camera fields
	cameraMake: z.string().max(50).optional(),
	cameraModel: z.string().max(50).optional(),
	lens: z.string().max(100).optional(),
	focalLength: z.string().max(20).optional(),
	aperture: z.string().max(20).optional(),
	shutterSpeed: z.string().max(20).optional(),
	iso: z.string().max(20).optional(),
});

export type PhotoMetadataFormData = z.infer<typeof photoMetadataSchema>;

export interface PhotoMetadataCardProps {
	file: File;
	categories: CategoryWithSubmissionInfo[];
	initialData?: Partial<PhotoMetadataFormData>;
	onMetadataChange: (metadata: PhotoMetadataFormData | null) => void;
	onRemove: () => void;
	uploadProgress?: number;
	uploadError?: string;
	isUploading?: boolean;
	isCompleted?: boolean;
	className?: string;
}

export function PhotoMetadataCard({
	file,
	categories,
	initialData,
	onMetadataChange,
	onRemove,
	uploadProgress = 0,
	uploadError,
	isUploading = false,
	isCompleted = false,
	className,
}: PhotoMetadataCardProps) {
	const [showCameraInfo, setShowCameraInfo] = useState(false);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors, isValid },
		trigger,
	} = useForm<PhotoMetadataFormData>({
		resolver: zodResolver(photoMetadataSchema),
		mode: "onChange",
		defaultValues: {
			categoryId: initialData?.categoryId || "",
			title: initialData?.title || "",
			description: initialData?.description || "",
			dateTaken: initialData?.dateTaken || "",
			location: initialData?.location || "",
			cameraMake: initialData?.cameraMake || "",
			cameraModel: initialData?.cameraModel || "",
			lens: initialData?.lens || "",
			focalLength: initialData?.focalLength || "",
			aperture: initialData?.aperture || "",
			shutterSpeed: initialData?.shutterSpeed || "",
			iso: initialData?.iso || "",
		},
	});

	// Watch form values for validation and change detection
	const formValues = watch();

	// Generate preview URL for the image
	useEffect(() => {
		const objectUrl = URL.createObjectURL(file);
		setPreviewUrl(objectUrl);
		return () => URL.revokeObjectURL(objectUrl);
	}, [file]);

	// Auto-validate and notify parent of changes
	useEffect(() => {
		const timer = setTimeout(async () => {
			const isFormValid = await trigger();
			if (isFormValid) {
				try {
					const validData = photoMetadataSchema.parse(formValues);
					onMetadataChange(validData);
					setLastSaved(new Date());
				} catch {
					onMetadataChange(null);
				}
			} else {
				onMetadataChange(null);
			}
		}, 500);

		return () => clearTimeout(timer);
	}, [formValues, trigger, onMetadataChange]);

	// Character counters
	const titleLength = formValues.title?.length || 0;
	const descriptionLength = formValues.description?.length || 0;
	const locationLength = formValues.location?.length || 0;

	// Format today's date for max attribute
	const today = new Date().toISOString().split("T")[0];

	// Format file size
	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	return (
		<div className={cn("bg-white border rounded-lg p-6 space-y-6", className)}>
			{/* Header with image preview and remove button */}
			<div className="flex items-start space-x-4">
				<div className="flex-shrink-0">
					{previewUrl && (
						<img
							src={previewUrl}
							alt="Preview"
							className="w-20 h-20 object-cover rounded-lg border"
						/>
					)}
				</div>
				<div className="flex-1 min-w-0">
					<h3 className="font-medium text-gray-900 truncate">{file.name}</h3>
					<p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>

					{/* Upload status */}
					{isUploading && (
						<div className="mt-2">
							<div className="flex items-center justify-between text-xs text-gray-600 mb-1">
								<span>Uploading...</span>
								<span>{uploadProgress}%</span>
							</div>
							<div className="w-full bg-gray-200 rounded-full h-1">
								<div
									className="bg-primary h-1 rounded-full transition-all duration-300"
									style={{ width: `${uploadProgress}%` }}
								/>
							</div>
						</div>
					)}

					{isCompleted && (
						<div className="mt-2 text-xs text-green-600 flex items-center">
							<div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
							Upload complete
						</div>
					)}

					{uploadError && (
						<div className="mt-2 text-xs text-red-600 flex items-center">
							<div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
							{uploadError}
						</div>
					)}
				</div>
				<button
					type="button"
					onClick={onRemove}
					className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
				>
					<X className="h-4 w-4" />
				</button>
			</div>

			{/* Category Selection */}
			<div className="space-y-2">
				<span className="text-sm font-medium text-gray-700">Category *</span>
				<CategorySelect
					categories={categories}
					selectedCategoryId={formValues.categoryId}
					onCategoryChange={(categoryId) => setValue("categoryId", categoryId)}
					placeholder="Select a category for this photo"
				/>
				{errors.categoryId && (
					<p className="text-sm text-red-600">{errors.categoryId.message}</p>
				)}
			</div>

			{/* Title */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<label
						htmlFor={`title-${file.name}`}
						className="text-sm font-medium text-gray-700"
					>
						Photo Title *
					</label>
					<span
						className={cn(
							"text-xs",
							titleLength > 100 ? "text-red-500" : "text-gray-500",
						)}
					>
						{titleLength}/100
					</span>
				</div>
				<input
					{...register("title")}
					type="text"
					id={`title-${file.name}`}
					placeholder="Enter a descriptive title for your photo"
					className={cn(
						"w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800",
						errors.title ? "border-red-300" : "border-gray-300",
					)}
					maxLength={100}
				/>
				{errors.title && (
					<p className="text-sm text-red-600">{errors.title.message}</p>
				)}
			</div>

			{/* Description */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<label
						htmlFor={`description-${file.name}`}
						className="text-sm font-medium text-gray-700"
					>
						Description *
					</label>
					<span
						className={cn(
							"text-xs",
							descriptionLength > 500
								? "text-red-500"
								: descriptionLength < 10
									? "text-amber-500"
									: "text-gray-500",
						)}
					>
						{descriptionLength}/500 (min: 10)
					</span>
				</div>
				<textarea
					{...register("description")}
					id={`description-${file.name}`}
					rows={3}
					placeholder="Describe your photo, the story behind it, technique used, etc. (minimum 10 characters)"
					className={cn(
						"w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-vertical text-gray-800",
						errors.description ? "border-red-300" : "border-gray-300",
					)}
					maxLength={500}
				/>
				{errors.description && (
					<p className="text-sm text-red-600">{errors.description.message}</p>
				)}
			</div>

			{/* Date Taken */}
			<div className="space-y-2">
				<label
					htmlFor={`dateTaken-${file.name}`}
					className="text-sm font-medium text-gray-700"
				>
					Date Taken *
				</label>
				<div className="relative">
					<input
						{...register("dateTaken")}
						type="date"
						id={`dateTaken-${file.name}`}
						max={today}
						className={cn(
							"w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800",
							errors.dateTaken ? "border-red-300" : "border-gray-300",
						)}
					/>
					<Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
				</div>
				{errors.dateTaken && (
					<p className="text-sm text-red-600">{errors.dateTaken.message}</p>
				)}
			</div>

			{/* Location */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<label
						htmlFor={`location-${file.name}`}
						className="text-sm font-medium text-gray-700"
					>
						Location *
					</label>
					<span
						className={cn(
							"text-xs",
							locationLength > 100 ? "text-red-500" : "text-gray-500",
						)}
					>
						{locationLength}/100
					</span>
				</div>
				<input
					{...register("location")}
					type="text"
					id={`location-${file.name}`}
					placeholder="Where was this photo taken?"
					className={cn(
						"w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800",
						errors.location ? "border-red-300" : "border-gray-300",
					)}
					maxLength={100}
				/>
				{errors.location && (
					<p className="text-sm text-red-600">{errors.location.message}</p>
				)}
			</div>

			{/* Camera Information (Collapsible) */}
			<div className="border rounded-lg">
				<button
					type="button"
					onClick={() => setShowCameraInfo(!showCameraInfo)}
					className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 rounded-lg"
				>
					<div className="flex items-center space-x-2">
						<Camera className="h-4 w-4 text-gray-500" />
						<span className="text-sm font-medium text-gray-700">
							Camera Information (Optional)
						</span>
					</div>
					{showCameraInfo ? (
						<ChevronUp className="h-4 w-4 text-gray-500" />
					) : (
						<ChevronDown className="h-4 w-4 text-gray-500" />
					)}
				</button>

				{showCameraInfo && (
					<div className="p-4 pt-0 space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Camera Make */}
							<div>
								<label
									htmlFor={`cameraMake-${file.name}`}
									className="text-sm font-medium text-gray-700"
								>
									Camera Make
								</label>
								<input
									{...register("cameraMake")}
									type="text"
									id={`cameraMake-${file.name}`}
									placeholder="e.g., Canon, Nikon"
									className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
									maxLength={50}
								/>
							</div>

							{/* Camera Model */}
							<div>
								<label
									htmlFor={`cameraModel-${file.name}`}
									className="text-sm font-medium text-gray-700"
								>
									Camera Model
								</label>
								<input
									{...register("cameraModel")}
									type="text"
									id={`cameraModel-${file.name}`}
									placeholder="e.g., EOS R5, D850"
									className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
									maxLength={50}
								/>
							</div>

							{/* Lens */}
							<div className="md:col-span-2">
								<label
									htmlFor={`lens-${file.name}`}
									className="text-sm font-medium text-gray-700"
								>
									Lens
								</label>
								<input
									{...register("lens")}
									type="text"
									id={`lens-${file.name}`}
									placeholder="e.g., 24-70mm f/2.8"
									className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
									maxLength={100}
								/>
							</div>

							{/* Focal Length */}
							<div>
								<label
									htmlFor={`focalLength-${file.name}`}
									className="text-sm font-medium text-gray-700"
								>
									Focal Length
								</label>
								<input
									{...register("focalLength")}
									type="text"
									id={`focalLength-${file.name}`}
									placeholder="e.g., 50mm"
									className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
									maxLength={20}
								/>
							</div>

							{/* Aperture */}
							<div>
								<label
									htmlFor={`aperture-${file.name}`}
									className="text-sm font-medium text-gray-700"
								>
									Aperture
								</label>
								<input
									{...register("aperture")}
									type="text"
									id={`aperture-${file.name}`}
									placeholder="e.g., f/2.8"
									className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
									maxLength={20}
								/>
							</div>

							{/* Shutter Speed */}
							<div>
								<label
									htmlFor={`shutterSpeed-${file.name}`}
									className="text-sm font-medium text-gray-700"
								>
									Shutter Speed
								</label>
								<input
									{...register("shutterSpeed")}
									type="text"
									id={`shutterSpeed-${file.name}`}
									placeholder="e.g., 1/125s"
									className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
									maxLength={20}
								/>
							</div>

							{/* ISO */}
							<div>
								<label
									htmlFor={`iso-${file.name}`}
									className="text-sm font-medium text-gray-700"
								>
									ISO
								</label>
								<input
									{...register("iso")}
									type="text"
									id={`iso-${file.name}`}
									placeholder="e.g., 400"
									className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
									maxLength={20}
								/>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Form validation status */}
			<div className="flex items-center justify-between text-xs">
				{lastSaved && isValid && (
					<div className="flex items-center space-x-2 text-green-600">
						<Save className="h-3 w-3" />
						<span>Valid metadata at {lastSaved.toLocaleTimeString()}</span>
					</div>
				)}
				{!isValid && Object.keys(errors).length > 0 && (
					<div className="text-red-600">
						Please complete all required fields:{" "}
						{Object.keys(errors)
							.map((field) => {
								const displayName =
									field === "categoryId"
										? "Category"
										: field === "dateTaken"
											? "Date Taken"
											: field.charAt(0).toUpperCase() + field.slice(1);
								return displayName;
							})
							.join(", ")}
					</div>
				)}
			</div>
		</div>
	);
}
