/**
 * Photo metadata form component with validation and auto-save
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Camera, ChevronDown, ChevronUp, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "~/lib/utils";

// Validation schema
const metadataSchema = z.object({
	title: z
		.string()
		.min(3, "Title must be at least 3 characters")
		.max(100, "Title must not exceed 100 characters"),
	description: z
		.string()
		.min(20, "Description must be at least 20 characters")
		.max(500, "Description must not exceed 500 characters"),
	dateTaken: z
		.string()
		.min(1, "Date taken is required")
		.refine((date) => {
			const selectedDate = new Date(date);
			const today = new Date();
			today.setHours(23, 59, 59, 999); // End of today
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

export type PhotoMetadata = z.infer<typeof metadataSchema>;

export interface MetadataFormProps {
	initialData?: Partial<PhotoMetadata>;
	onSubmit: (data: PhotoMetadata) => void;
	onSaveDraft?: (data: PhotoMetadata) => void;
	isSubmitting?: boolean;
	className?: string;
}

export function MetadataForm({
	initialData,
	onSubmit,
	onSaveDraft,
	isSubmitting = false,
	className,
}: MetadataFormProps) {
	const [showCameraInfo, setShowCameraInfo] = useState(false);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
		trigger,
	} = useForm<PhotoMetadata>({
		resolver: zodResolver(metadataSchema),
		defaultValues: {
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

	// Watch form values for auto-save
	const formValues = watch();

	// Auto-save functionality
	useEffect(() => {
		const timer = setTimeout(() => {
			if (onSaveDraft) {
				// Only save if we have some meaningful data
				if (formValues.title || formValues.description || formValues.location) {
					try {
						const validData = metadataSchema.parse(formValues);
						onSaveDraft(validData);
						setLastSaved(new Date());
					} catch {
						// If validation fails, still save draft but don't update timestamp
						onSaveDraft(formValues as PhotoMetadata);
					}
				}
			}
		}, 1000); // Auto-save after 1 second of inactivity

		return () => clearTimeout(timer);
	}, [formValues, onSaveDraft]);

	// Character counters
	const titleLength = formValues.title?.length || 0;
	const descriptionLength = formValues.description?.length || 0;
	const locationLength = formValues.location?.length || 0;

	// Handle form submission
	const handleFormSubmit = async (data: PhotoMetadata) => {
		onSubmit(data);
	};

	// Format today's date for max attribute
	const today = new Date().toISOString().split("T")[0];

	return (
		<form
			onSubmit={handleSubmit(handleFormSubmit)}
			className={cn("space-y-6", className)}
		>
			{/* Title */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<label htmlFor="title" className="text-sm font-medium text-gray-700">
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
					id="title"
					placeholder="Enter a descriptive title for your photo"
					className={cn(
						"w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900",
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
						htmlFor="description"
						className="text-sm font-medium text-gray-700"
					>
						Description *
					</label>
					<span
						className={cn(
							"text-xs",
							descriptionLength > 500 ? "text-red-500" : "text-gray-500",
						)}
					>
						{descriptionLength}/500
					</span>
				</div>
				<textarea
					{...register("description")}
					id="description"
					rows={4}
					placeholder="Describe your photo, the story behind it, technique used, etc."
					className={cn(
						"w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-vertical text-gray-900",
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
					htmlFor="dateTaken"
					className="text-sm font-medium text-gray-700"
				>
					Date Taken *
				</label>
				<div className="relative">
					<input
						{...register("dateTaken")}
						type="date"
						id="dateTaken"
						max={today}
						className={cn(
							"w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900",
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
						htmlFor="location"
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
					id="location"
					placeholder="Where was this photo taken?"
					className={cn(
						"w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900",
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
									htmlFor="cameraMake"
									className="text-sm font-medium text-gray-700"
								>
									Camera Make
								</label>
								<input
									{...register("cameraMake")}
									type="text"
									id="cameraMake"
									placeholder="e.g., Canon, Nikon"
									className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900"
									maxLength={50}
								/>
							</div>

							{/* Camera Model */}
							<div>
								<label
									htmlFor="cameraModel"
									className="text-sm font-medium text-gray-700"
								>
									Camera Model
								</label>
								<input
									{...register("cameraModel")}
									type="text"
									id="cameraModel"
									placeholder="e.g., EOS R5, D850"
									className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900"
									maxLength={50}
								/>
							</div>

							{/* Lens */}
							<div className="md:col-span-2">
								<label
									htmlFor="lens"
									className="text-sm font-medium text-gray-700"
								>
									Lens
								</label>
								<input
									{...register("lens")}
									type="text"
									id="lens"
									placeholder="e.g., 24-70mm f/2.8"
									className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900"
									maxLength={100}
								/>
							</div>

							{/* Focal Length */}
							<div>
								<label
									htmlFor="focalLength"
									className="text-sm font-medium text-gray-700"
								>
									Focal Length
								</label>
								<input
									{...register("focalLength")}
									type="text"
									id="focalLength"
									placeholder="e.g., 50mm"
									className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900"
									maxLength={20}
								/>
							</div>

							{/* Aperture */}
							<div>
								<label
									htmlFor="aperture"
									className="text-sm font-medium text-gray-700"
								>
									Aperture
								</label>
								<input
									{...register("aperture")}
									type="text"
									id="aperture"
									placeholder="e.g., f/2.8"
									className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900"
									maxLength={20}
								/>
							</div>

							{/* Shutter Speed */}
							<div>
								<label
									htmlFor="shutterSpeed"
									className="text-sm font-medium text-gray-700"
								>
									Shutter Speed
								</label>
								<input
									{...register("shutterSpeed")}
									type="text"
									id="shutterSpeed"
									placeholder="e.g., 1/125s"
									className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900"
									maxLength={20}
								/>
							</div>

							{/* ISO */}
							<div>
								<label
									htmlFor="iso"
									className="text-sm font-medium text-gray-700"
								>
									ISO
								</label>
								<input
									{...register("iso")}
									type="text"
									id="iso"
									placeholder="e.g., 400"
									className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900"
									maxLength={20}
								/>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Auto-save status */}
			{lastSaved && (
				<div className="flex items-center space-x-2 text-xs text-gray-500">
					<Save className="h-3 w-3" />
					<span>Draft saved at {lastSaved.toLocaleTimeString()}</span>
				</div>
			)}

			{/* Submit Button */}
			<div className="flex justify-end">
				<button
					type="submit"
					disabled={isSubmitting}
					className={cn(
						"px-6 py-2 bg-primary text-white rounded-lg font-medium",
						"hover:bg-primary/90 focus:ring-2 focus:ring-primary/20",
						"disabled:opacity-50 disabled:cursor-not-allowed",
						isSubmitting && "animate-pulse",
					)}
				>
					{isSubmitting ? "Saving..." : "Save Changes"}
				</button>
			</div>
		</form>
	);
}
