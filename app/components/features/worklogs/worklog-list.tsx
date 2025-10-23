import { useQuery } from "convex/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "../../../../convex/_generated/api";

type FilterType = "all" | "overtime" | "undertime" | "normal";

export const WorklogList = () => {
	const [filter, setFilter] = useState<FilterType>("all");
	const [page, setPage] = useState(0);
	const limit = 10;

	const data = useQuery(api.worklogs.getMyWorklogs, {
		filter,
		limit,
		offset: page * limit,
	});

	const isLoading = data === undefined;

	const handleFilterChange = (newFilter: FilterType) => {
		setFilter(newFilter);
		setPage(0); // Reset to first page when filter changes
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				{/* Filter Skeleton */}
				<div className="flex gap-2">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-10 w-24" />
					))}
				</div>

				{/* Days Skeleton */}
				<div className="space-y-4">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-32 w-full" />
					))}
				</div>
			</div>
		);
	}

	const { days, totalCount, hasMore, userMinHours, userMaxHours } = data;

	// Get count of days for each status (for display in filter buttons)
	const allData = useQuery(api.worklogs.getMyWorklogs, {
		filter: "all",
		limit: 1000, // Get all for counting
		offset: 0,
	});

	const overtimeCount =
		allData?.days.filter((d) => d.status === "overtime").length || 0;
	const undertimeCount =
		allData?.days.filter((d) => d.status === "undertime").length || 0;
	const normalCount =
		allData?.days.filter((d) => d.status === "normal").length || 0;

	return (
		<div className="space-y-6">
			{/* Filter Buttons */}
			<div className="flex flex-wrap gap-2">
				<Button
					variant={filter === "all" ? "default" : "outline"}
					size="sm"
					onClick={() => handleFilterChange("all")}
				>
					All Days
					{allData && (
						<span className="ml-1.5 text-xs opacity-70">
							({allData.totalCount})
						</span>
					)}
				</Button>
				<Button
					variant={filter === "overtime" ? "default" : "outline"}
					size="sm"
					onClick={() => handleFilterChange("overtime")}
				>
					Overtime
					<span className="ml-1.5 text-xs opacity-70">({overtimeCount})</span>
				</Button>
				<Button
					variant={filter === "undertime" ? "default" : "outline"}
					size="sm"
					onClick={() => handleFilterChange("undertime")}
				>
					Undertime
					<span className="ml-1.5 text-xs opacity-70">({undertimeCount})</span>
				</Button>
				<Button
					variant={filter === "normal" ? "default" : "outline"}
					size="sm"
					onClick={() => handleFilterChange("normal")}
				>
					Normal
					<span className="ml-1.5 text-xs opacity-70">({normalCount})</span>
				</Button>
			</div>

			{/* Policy Info */}
			<div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-md p-3">
				<span className="font-medium">Your daily hours policy:</span> Min:{" "}
				{userMinHours}h, Max: {userMaxHours}h
			</div>

			{/* Days List */}
			{days.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-gray-500">
						{filter === "all"
							? "No worklogs yet. Add one above to get started!"
							: `No ${filter} days found. ${filter === "overtime" ? "Good job staying within your hours!" : filter === "undertime" ? "You're working within or above your expected hours!" : "No normal days found."}`}
					</p>
					{filter !== "all" && (
						<Button
							variant="link"
							onClick={() => setFilter("all")}
							className="mt-2"
						>
							Show all days
						</Button>
					)}
				</div>
			) : (
				<div className="space-y-4">
					{days.map((day) => (
						<DayCard
							key={day.date}
							day={day}
							userMinHours={userMinHours}
							userMaxHours={userMaxHours}
						/>
					))}
				</div>
			)}

			{/* Pagination */}
			{totalCount > limit && (
				<div className="flex items-center justify-between border-t pt-4">
					<div className="text-sm text-gray-600">
						Showing {page * limit + 1} to {Math.min((page + 1) * limit, totalCount)} of {totalCount} days
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPage((p) => Math.max(0, p - 1))}
							disabled={page === 0}
						>
							<ChevronLeft className="h-4 w-4 mr-1" />
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPage((p) => p + 1)}
							disabled={!hasMore}
						>
							Next
							<ChevronRight className="h-4 w-4 ml-1" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
};

// Day Card Component
interface DayCardProps {
	day: {
		date: string;
		totalHours: number;
		status: "normal" | "overtime" | "undertime";
		entries: Array<{
			_id: string;
			workedHours: number;
			taskId?: string;
			description?: string;
			createdAt: number;
		}>;
	};
	userMinHours: number;
	userMaxHours: number;
}

const DayCard = ({ day, userMinHours, userMaxHours }: DayCardProps) => {
	// Format date as "Monday, Jan 15, 2024"
	const formattedDate = new Date(day.date + "T00:00:00").toLocaleDateString(
		"en-US",
		{
			weekday: "long",
			year: "numeric",
			month: "short",
			day: "numeric",
		},
	);

	// Get badge variant based on status
	const badgeVariant =
		day.status === "overtime"
			? "destructive"
			: day.status === "undertime"
				? "secondary"
				: "default";

	const badgeText =
		day.status === "overtime"
			? "OT"
			: day.status === "undertime"
				? "UT"
				: "Normal";

	return (
		<Card className="p-4">
			{/* Day Header */}
			<div className="flex items-center justify-between mb-4 pb-3 border-b">
				<div>
					<h3 className="font-semibold text-lg">{formattedDate}</h3>
					<p className="text-sm text-gray-600">
						Total: {day.totalHours.toFixed(1)}h
					</p>
				</div>
				<div className="flex items-center gap-2">
					{day.status !== "normal" && (
						<Badge variant={badgeVariant}>{badgeText}</Badge>
					)}
					<span className="text-xs text-gray-500">
						{day.entries.length} {day.entries.length === 1 ? "entry" : "entries"}
					</span>
				</div>
			</div>

			{/* Entries List */}
			<div className="space-y-2">
				{day.entries.map((entry) => (
					<div
						key={entry._id}
						className="flex items-start justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
					>
						<div className="flex-1">
							<div className="flex items-center gap-2">
								<span className="font-medium">{entry.workedHours}h</span>
								{entry.taskId && (
									<Badge variant="outline" className="text-xs">
										{entry.taskId}
									</Badge>
								)}
							</div>
							{entry.description && (
								<p className="text-sm text-gray-600 mt-1">
									{entry.description}
								</p>
							)}
						</div>
						<div className="text-xs text-gray-400">
							{new Date(entry.createdAt).toLocaleTimeString("en-US", {
								hour: "numeric",
								minute: "2-digit",
							})}
						</div>
					</div>
				))}
			</div>
		</Card>
	);
};
