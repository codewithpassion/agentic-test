/**
 * Submission filters component
 */

import { X } from "lucide-react";
import { trpc } from "~/lib/trpc";
import { cn } from "~/lib/utils";

// Filter state interface
interface FilterState {
	competitionId?: string;
	categoryId?: string;
	status?: "pending" | "approved" | "rejected";
	search?: string;
	dateFrom?: string;
	dateTo?: string;
}

export interface SubmissionFiltersProps {
	selectedFilters: FilterState;
	onFiltersChange: (filters: FilterState) => void;
	className?: string;
}

export function SubmissionFilters({
	selectedFilters,
	onFiltersChange,
	className,
}: SubmissionFiltersProps) {
	// Fetch competitions for filter dropdown
	const { data: competitions } = trpc.competitions.list.useQuery({
		limit: 100,
		offset: 0,
	});

	// Fetch categories based on selected competition
	const { data: categoriesData } =
		trpc.competitions.getCategoriesWithStats.useQuery(
			{ competitionId: selectedFilters.competitionId || "" },
			{ enabled: !!selectedFilters.competitionId },
		);

	// Handle filter updates
	const updateFilter = (key: keyof FilterState, value: string | undefined) => {
		const newFilters = { ...selectedFilters };

		if (value === "" || value === undefined) {
			newFilters[key] = undefined;
		} else {
			// Type-safe assignment based on key
			if (
				key === "competitionId" ||
				key === "categoryId" ||
				key === "search" ||
				key === "dateFrom" ||
				key === "dateTo"
			) {
				newFilters[key] = value;
			} else if (key === "status") {
				newFilters[key] = value as "pending" | "approved" | "rejected";
			}
		}

		// Clear category if competition changes
		if (key === "competitionId" && value !== selectedFilters.competitionId) {
			newFilters.categoryId = undefined;
		}

		onFiltersChange(newFilters);
	};

	// Clear all filters
	const clearAllFilters = () => {
		onFiltersChange({});
	};

	// Check if any filters are active
	const hasActiveFilters = Object.keys(selectedFilters).some(
		(key) => selectedFilters[key as keyof FilterState] !== undefined,
	);

	return (
		<div className={cn("space-y-4", className)}>
			{/* Filter Controls */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{/* Competition Filter */}
				<div>
					<label
						htmlFor="competition"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Competition
					</label>
					<select
						id="competition"
						value={selectedFilters.competitionId || ""}
						onChange={(e) => updateFilter("competitionId", e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
					>
						<option value="">All competitions</option>
						{competitions?.map((competition) => (
							<option key={competition.id} value={competition.id}>
								{competition.title}
							</option>
						))}
					</select>
				</div>

				{/* Category Filter */}
				<div>
					<label
						htmlFor="category"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Category
					</label>
					<select
						id="category"
						value={selectedFilters.categoryId || ""}
						onChange={(e) => updateFilter("categoryId", e.target.value)}
						disabled={!selectedFilters.competitionId}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50 disabled:text-gray-500"
					>
						<option value="">All categories</option>
						{categoriesData?.categories.map((category) => (
							<option key={category.id} value={category.id}>
								{category.name}
							</option>
						))}
					</select>
				</div>

				{/* Status Filter */}
				<div>
					<label
						htmlFor="status"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Status
					</label>
					<select
						id="status"
						value={selectedFilters.status || ""}
						onChange={(e) => updateFilter("status", e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
					>
						<option value="">All statuses</option>
						<option value="pending">Under Review</option>
						<option value="approved">Approved</option>
						<option value="rejected">Rejected</option>
					</select>
				</div>

				{/* Clear Filters Button */}
				<div className="flex items-end">
					<button
						type="button"
						onClick={clearAllFilters}
						disabled={!hasActiveFilters}
						className={cn(
							"w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-colors",
							hasActiveFilters
								? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
								: "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200",
						)}
					>
						<X className="h-4 w-4" />
						<span>Clear Filters</span>
					</button>
				</div>
			</div>

			{/* Date Range Filters */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label
						htmlFor="dateFrom"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Submitted From
					</label>
					<input
						type="date"
						id="dateFrom"
						value={selectedFilters.dateFrom || ""}
						onChange={(e) => updateFilter("dateFrom", e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
					/>
				</div>
				<div>
					<label
						htmlFor="dateTo"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Submitted To
					</label>
					<input
						type="date"
						id="dateTo"
						value={selectedFilters.dateTo || ""}
						onChange={(e) => updateFilter("dateTo", e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
					/>
				</div>
			</div>

			{/* Active Filters Display */}
			{hasActiveFilters && (
				<div className="flex flex-wrap gap-2 pt-2">
					<span className="text-sm font-medium text-gray-600">
						Active filters:
					</span>
					{selectedFilters.competitionId && (
						<span className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
							Competition:{" "}
							{
								competitions?.find(
									(c) => c.id === selectedFilters.competitionId,
								)?.title
							}
							<button
								type="button"
								onClick={() => updateFilter("competitionId", undefined)}
								className="ml-1 hover:text-primary/80"
							>
								<X className="h-3 w-3" />
							</button>
						</span>
					)}
					{selectedFilters.categoryId && (
						<span className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
							Category:{" "}
							{
								categoriesData?.categories.find(
									(c) => c.id === selectedFilters.categoryId,
								)?.name
							}
							<button
								type="button"
								onClick={() => updateFilter("categoryId", undefined)}
								className="ml-1 hover:text-primary/80"
							>
								<X className="h-3 w-3" />
							</button>
						</span>
					)}
					{selectedFilters.status && (
						<span className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
							Status:{" "}
							{selectedFilters.status === "pending"
								? "Under Review"
								: selectedFilters.status}
							<button
								type="button"
								onClick={() => updateFilter("status", undefined)}
								className="ml-1 hover:text-primary/80"
							>
								<X className="h-3 w-3" />
							</button>
						</span>
					)}
					{(selectedFilters.dateFrom || selectedFilters.dateTo) && (
						<span className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
							Date Range
							<button
								type="button"
								onClick={() => {
									updateFilter("dateFrom", undefined);
									updateFilter("dateTo", undefined);
								}}
								className="ml-1 hover:text-primary/80"
							>
								<X className="h-3 w-3" />
							</button>
						</span>
					)}
				</div>
			)}
		</div>
	);
}
