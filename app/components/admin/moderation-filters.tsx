import { Filter, Search, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";

export type PhotoStatus = "all" | "pending" | "approved" | "rejected";

export interface ModerationFilters {
	search: string;
	status: PhotoStatus;
	competitionId?: string;
	categoryId?: string;
	dateFrom?: string;
	dateTo?: string;
}

interface ModerationFiltersProps {
	filters: ModerationFilters;
	onFiltersChange: (filters: ModerationFilters) => void;
	competitions?: Array<{ id: string; title: string }>;
	categories?: Array<{ id: string; name: string }>;
	showCompetitionFilter?: boolean;
	showCategoryFilter?: boolean;
	showDateFilter?: boolean;
	className?: string;
}

export function ModerationFiltersComponent({
	filters,
	onFiltersChange,
	competitions = [],
	categories = [],
	showCompetitionFilter = true,
	showCategoryFilter = true,
	showDateFilter = true,
	className,
}: ModerationFiltersProps) {
	const statusOptions = [
		{ value: "all" as const, label: "All Status", count: undefined },
		{ value: "pending" as const, label: "Pending", count: undefined },
		{ value: "approved" as const, label: "Approved", count: undefined },
		{ value: "rejected" as const, label: "Rejected", count: undefined },
	];

	const updateFilter = (
		key: keyof ModerationFilters,
		value: string | undefined,
	) => {
		onFiltersChange({
			...filters,
			[key]: value,
		});
	};

	const clearFilters = () => {
		onFiltersChange({
			search: "",
			status: "all",
			competitionId: undefined,
			categoryId: undefined,
			dateFrom: undefined,
			dateTo: undefined,
		});
	};

	const hasActiveFilters =
		filters.search !== "" ||
		filters.status !== "all" ||
		filters.competitionId ||
		filters.categoryId ||
		filters.dateFrom ||
		filters.dateTo;

	return (
		<Card className={className}>
			<CardContent className="p-6">
				<div className="space-y-4">
					{/* Search */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
						<Input
							type="text"
							placeholder="Search by title, user, competition, or category..."
							value={filters.search}
							onChange={(e) => updateFilter("search", e.target.value)}
							className="pl-10"
						/>
					</div>

					{/* Status Filter */}
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Filter className="h-4 w-4 text-gray-400" />
							<span className="text-sm font-medium text-gray-700">Status:</span>
						</div>
						<div className="flex flex-wrap gap-2">
							{statusOptions.map((option) => (
								<Button
									key={option.value}
									variant={
										filters.status === option.value ? "default" : "outline"
									}
									size="sm"
									onClick={() => updateFilter("status", option.value)}
									className="text-xs"
								>
									{option.label}
									{option.count !== undefined && (
										<span className="ml-1 text-xs opacity-75">
											({option.count})
										</span>
									)}
								</Button>
							))}
						</div>
					</div>

					{/* Competition Filter */}
					{showCompetitionFilter && competitions.length > 0 && (
						<div className="space-y-2">
							<label
								htmlFor="competition-filter"
								className="text-sm font-medium text-gray-700"
							>
								Competition:
							</label>
							<select
								id="competition-filter"
								value={filters.competitionId || ""}
								onChange={(e) =>
									updateFilter("competitionId", e.target.value || undefined)
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
							>
								<option value="">All Competitions</option>
								{competitions.map((competition) => (
									<option key={competition.id} value={competition.id}>
										{competition.title}
									</option>
								))}
							</select>
						</div>
					)}

					{/* Category Filter */}
					{showCategoryFilter && categories.length > 0 && (
						<div className="space-y-2">
							<label
								htmlFor="category-filter"
								className="text-sm font-medium text-gray-700"
							>
								Category:
							</label>
							<select
								id="category-filter"
								value={filters.categoryId || ""}
								onChange={(e) =>
									updateFilter("categoryId", e.target.value || undefined)
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
							>
								<option value="">All Categories</option>
								{categories.map((category) => (
									<option key={category.id} value={category.id}>
										{category.name}
									</option>
								))}
							</select>
						</div>
					)}

					{/* Date Range Filter */}
					{showDateFilter && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<label
									htmlFor="date-from-filter"
									className="text-sm font-medium text-gray-700"
								>
									From Date:
								</label>
								<Input
									id="date-from-filter"
									type="date"
									value={filters.dateFrom || ""}
									onChange={(e) =>
										updateFilter("dateFrom", e.target.value || undefined)
									}
									className="text-sm"
								/>
							</div>
							<div className="space-y-2">
								<label
									htmlFor="date-to-filter"
									className="text-sm font-medium text-gray-700"
								>
									To Date:
								</label>
								<Input
									id="date-to-filter"
									type="date"
									value={filters.dateTo || ""}
									onChange={(e) =>
										updateFilter("dateTo", e.target.value || undefined)
									}
									className="text-sm"
								/>
							</div>
						</div>
					)}

					{/* Clear Filters */}
					{hasActiveFilters && (
						<div className="flex justify-between items-center pt-2 border-t">
							<span className="text-sm text-gray-600">
								Active filters applied
							</span>
							<Button
								variant="outline"
								size="sm"
								onClick={clearFilters}
								className="text-xs"
							>
								<X className="h-3 w-3 mr-1" />
								Clear All
							</Button>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
