import { Grid, Info, List, SortAsc, SortDesc } from "lucide-react";
import { cn } from "~/lib/utils";

interface Category {
	id: string;
	name: string;
}

interface GalleryFiltersProps {
	categories: Category[];
	selectedCategory?: string;
	onCategoryChange: (categoryId?: string) => void;
	layout: "grid" | "masonry";
	onLayoutChange: (layout: "grid" | "masonry") => void;
	sortBy: "newest" | "oldest" | "title" | "location";
	onSortChange: (sort: "newest" | "oldest" | "title" | "location") => void;
	showMetadata: boolean;
	onMetadataToggle: (show: boolean) => void;
	photoCount?: number;
	compact?: boolean;
	className?: string;
}

export function GalleryFilters({
	categories,
	selectedCategory,
	onCategoryChange,
	layout,
	onLayoutChange,
	sortBy,
	onSortChange,
	showMetadata,
	onMetadataToggle,
	photoCount,
	compact = false,
	className,
}: GalleryFiltersProps) {
	const sortOptions = [
		{ value: "newest", label: "Newest First" },
		{ value: "oldest", label: "Oldest First" },
		{ value: "title", label: "Title A-Z" },
		{ value: "location", label: "Location A-Z" },
	] as const;

	if (compact) {
		return (
			<div
				className={cn("flex flex-wrap items-center gap-2 text-sm", className)}
			>
				{/* Category Pills - only show if categories exist */}
				{categories.length > 0 && (
					<div className="flex flex-wrap gap-1">
						<button
							type="button"
							onClick={() => onCategoryChange(undefined)}
							className={cn(
								"px-3 py-1 rounded-full border transition-colors",
								!selectedCategory
									? "bg-black text-white border-black"
									: "bg-white text-gray-700 border-gray-300 hover:border-gray-400",
							)}
						>
							All
						</button>
						{categories.map((category) => (
							<button
								type="button"
								key={category.id}
								onClick={() => onCategoryChange(category.id)}
								className={cn(
									"px-3 py-1 rounded-full border transition-colors",
									selectedCategory === category.id
										? "bg-black text-white border-black"
										: "bg-white text-gray-700 border-gray-300 hover:border-gray-400",
								)}
							>
								{category.name}
							</button>
						))}
					</div>
				)}

				{/* Layout & Sort Controls */}
				<div className="flex items-center gap-1 ml-auto">
					<button
						type="button"
						onClick={() =>
							onLayoutChange(layout === "grid" ? "masonry" : "grid")
						}
						className="p-1 text-gray-600 hover:text-black transition-colors"
						title={`Switch to ${layout === "grid" ? "masonry" : "grid"} layout`}
					>
						{layout === "grid" ? <List size={16} /> : <Grid size={16} />}
					</button>

					<select
						value={sortBy}
						onChange={(e) => onSortChange(e.target.value as typeof sortBy)}
						className="text-xs border-none bg-transparent text-gray-600 focus:outline-none focus:text-black"
					>
						{sortOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>
			</div>
		);
	}

	return (
		<div className={cn("space-y-4", className)}>
			{/* Photo Count & Main Controls */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					{photoCount !== undefined && (
						<h2 className="text-lg font-medium text-gray-900">
							{photoCount} {photoCount === 1 ? "Photo" : "Photos"}
						</h2>
					)}
				</div>

				<div className="flex items-center gap-2">
					{/* Layout Toggle */}
					<div className="flex border rounded-lg p-1">
						<button
							type="button"
							onClick={() => onLayoutChange("grid")}
							className={cn(
								"p-2 rounded transition-colors",
								layout === "grid"
									? "bg-black text-white"
									: "text-gray-500 hover:text-gray-700",
							)}
							title="Grid layout"
						>
							<Grid size={16} />
						</button>
						<button
							type="button"
							onClick={() => onLayoutChange("masonry")}
							className={cn(
								"p-2 rounded transition-colors",
								layout === "masonry"
									? "bg-black text-white"
									: "text-gray-500 hover:text-gray-700",
							)}
							title="Masonry layout"
						>
							<List size={16} />
						</button>
					</div>

					{/* Sort Dropdown */}
					<select
						value={sortBy}
						onChange={(e) => onSortChange(e.target.value as typeof sortBy)}
						className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						{sortOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>

					{/* Metadata Toggle */}
					<button
						type="button"
						onClick={() => onMetadataToggle(!showMetadata)}
						className={cn(
							"p-2 border rounded-lg transition-colors",
							showMetadata
								? "bg-black text-white border-black"
								: "text-gray-500 hover:text-gray-700 border-gray-300",
						)}
						title="Toggle photo information"
					>
						<Info size={16} />
					</button>
				</div>
			</div>

			{/* Category Filters */}
			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					onClick={() => onCategoryChange(undefined)}
					className={cn(
						"px-4 py-2 rounded-full border transition-colors",
						!selectedCategory
							? "bg-black text-white border-black"
							: "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50",
					)}
				>
					All Categories
				</button>
				{categories.map((category) => (
					<button
						type="button"
						key={category.id}
						onClick={() => onCategoryChange(category.id)}
						className={cn(
							"px-4 py-2 rounded-full border transition-colors",
							selectedCategory === category.id
								? "bg-black text-white border-black"
								: "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50",
						)}
					>
						{category.name}
					</button>
				))}
			</div>

			{/* Active Filters Summary */}
			{(selectedCategory || sortBy !== "newest" || showMetadata) && (
				<div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
					<span>Active filters:</span>
					{selectedCategory && (
						<span className="bg-gray-100 px-2 py-1 rounded">
							Category:{" "}
							{categories.find((c) => c.id === selectedCategory)?.name}
						</span>
					)}
					{sortBy !== "newest" && (
						<span className="bg-gray-100 px-2 py-1 rounded">
							Sort: {sortOptions.find((s) => s.value === sortBy)?.label}
						</span>
					)}
					{showMetadata && (
						<span className="bg-gray-100 px-2 py-1 rounded">
							Showing metadata
						</span>
					)}
					<button
						type="button"
						onClick={() => {
							onCategoryChange(undefined);
							onSortChange("newest");
							onMetadataToggle(false);
						}}
						className="text-blue-600 hover:text-blue-700 underline"
					>
						Clear all
					</button>
				</div>
			)}
		</div>
	);
}
