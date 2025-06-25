/**
 * User submissions dashboard page
 */

import { Filter, Grid, List, Search } from "lucide-react";
import { useState } from "react";
import { SubmissionFilters } from "~/components/photo/submission-filters";
import { SubmissionStats } from "~/components/photo/submission-stats";
import { SubmissionsGrid } from "~/components/photo/submissions-grid";
import { PublicLayout } from "~/components/public-layout";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
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

// View mode type
type ViewMode = "grid" | "list";

export default function MySubmissions() {
	const [filters, setFilters] = useState<FilterState>({});
	const [viewMode, setViewMode] = useState<ViewMode>("grid");
	const [showFilters, setShowFilters] = useState(false);

	// Fetch active competitions
	const { data: competitions = [] } = trpc.competitions.list.useQuery({
		status: "active",
		limit: 1,
	});
	const activeCompetition = competitions[0];

	// Fetch user submissions with filters
	const {
		data: submissions,
		isLoading: submissionsLoading,
		error: submissionsError,
	} = trpc.photos.getUserSubmissions.useQuery({
		...filters,
		limit: 50,
		offset: 0,
	});

	// Fetch user statistics
	const {
		data: stats,
		isLoading: statsLoading,
		error: statsError,
	} = trpc.photos.getSubmissionStats.useQuery();

	// Handle filter changes
	const handleFiltersChange = (newFilters: FilterState) => {
		setFilters(newFilters);
	};

	// Handle view mode toggle
	const toggleViewMode = () => {
		setViewMode((prev) => (prev === "grid" ? "list" : "grid"));
	};

	// Loading state
	if (submissionsLoading || statsLoading) {
		return (
			<PublicLayout>
				<div className="bg-gray-50 py-8">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex items-center justify-center py-12">
							<LoadingSpinner className="h-8 w-8" />
						</div>
					</div>
				</div>
			</PublicLayout>
		);
	}

	// Error state
	if (submissionsError || statsError) {
		return (
			<PublicLayout>
				<div className="bg-gray-50 py-8">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="text-center py-12">
							<p className="text-red-600 mb-4">Failed to load submissions</p>
							<p className="text-gray-600">
								{submissionsError?.message || statsError?.message}
							</p>
						</div>
					</div>
				</div>
			</PublicLayout>
		);
	}

	return (
		<PublicLayout>
			<div className="bg-gray-50 py-8">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					{/* Header */}
					<div className="mb-8">
						<div className="flex items-center justify-between">
							<div>
								<h1 className="text-3xl font-bold text-gray-900">
									My Submissions
								</h1>
								<p className="text-gray-600 mt-2">
									Manage your photo submissions across all competitions
								</p>
							</div>
						</div>
					</div>

					{/* Statistics */}
					{stats && <SubmissionStats {...stats} />}

					{/* Call to Action */}
					<div className="text-center py-12 bg-white border border-gray-200 rounded-lg mb-8">
						<div className="max-w-md mx-auto">
							<a
								href={
									activeCompetition
										? `/submit/${activeCompetition.id}`
										: "/submit"
								}
								className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
							>
								Submit Your Photo
							</a>
						</div>
					</div>

					{/* Search and Filters */}
					{false && (
						<div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-lg font-semibold text-gray-900">
									Find Submissions
								</h2>
								<button
									type="button"
									onClick={() => setShowFilters(!showFilters)}
									className={cn(
										"flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors",
										showFilters
											? "bg-primary text-white"
											: "bg-gray-100 text-gray-700 hover:bg-gray-200",
									)}
								>
									<Filter className="h-4 w-4" />
									<span>Filters</span>
								</button>
							</div>

							{/* Search Bar */}
							<div className="relative mb-4">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
								<input
									type="text"
									placeholder="Search by title or description..."
									value={filters.search || ""}
									onChange={(e) =>
										handleFiltersChange({ ...filters, search: e.target.value })
									}
									className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
								/>
							</div>

							{/* Filters Panel */}
							{showFilters && (
								<SubmissionFilters
									selectedFilters={filters}
									onFiltersChange={handleFiltersChange}
								/>
							)}
						</div>
					)}

					{/* View Mode Toggle */}
					<div className="flex items-center justify-end space-x-2 mb-4">
						<button
							type="button"
							onClick={toggleViewMode}
							className={cn(
								"p-2 rounded-lg transition-colors",
								viewMode === "grid"
									? "bg-primary text-white"
									: "bg-white text-gray-600 hover:bg-gray-50",
							)}
							title="Grid view"
						>
							<Grid className="h-5 w-5" />
						</button>
						<button
							type="button"
							onClick={toggleViewMode}
							className={cn(
								"p-2 rounded-lg transition-colors",
								viewMode === "list"
									? "bg-primary text-white"
									: "bg-white text-gray-600 hover:bg-gray-50",
							)}
							title="List view"
						>
							<List className="h-5 w-5" />
						</button>
					</div>

					{/* Submissions Grid/List */}
					<SubmissionsGrid
						photos={submissions?.photos || []}
						loading={submissionsLoading}
						viewMode={viewMode}
						totalCount={submissions?.total || 0}
					/>

					{/* Empty State */}
					{(!submissions?.photos || submissions.photos.length === 0) &&
						!submissionsLoading && (
							<div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
								<div className="max-w-md mx-auto">
									<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
										<Search className="h-8 w-8 text-gray-400" />
									</div>
									<h3 className="text-lg font-medium text-gray-900 mb-2">
										No submissions found
									</h3>
									<p className="text-gray-600 mb-6">
										{Object.keys(filters).length > 0
											? "Try adjusting your filters to see more results."
											: "You haven't submitted any photos yet. Start by entering a competition!"}
									</p>
								</div>
							</div>
						)}
				</div>
			</div>
		</PublicLayout>
	);
}
