/**
 * Competition selector component for submission flow
 */

import { Calendar, ChevronRight, Trophy, Users } from "lucide-react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";
import type { Competition } from "../../../api/database/schema";

export interface CompetitionWithStats extends Competition {
	categoryCount: number;
	userSubmissionCount: number;
	totalSubmissions: number;
	daysRemaining: number | null;
}

export interface CompetitionSelectorProps {
	competitions: CompetitionWithStats[];
	className?: string;
}

export function CompetitionSelector({
	competitions,
	className,
}: CompetitionSelectorProps) {
	// Filter active competitions
	const activeCompetitions = competitions.filter(
		(comp) => comp.status === "active",
	);

	// Get status badge info
	const getStatusInfo = (competition: CompetitionWithStats) => {
		const { daysRemaining, status } = competition;

		if (status !== "active") {
			return {
				text: status === "completed" ? "Completed" : "Draft",
				color: "bg-gray-100 text-gray-600",
				urgent: false,
			};
		}

		if (daysRemaining === null) {
			return {
				text: "Active",
				color: "bg-green-100 text-green-700",
				urgent: false,
			};
		}

		if (daysRemaining <= 1) {
			return {
				text: daysRemaining === 0 ? "Ends today" : "1 day left",
				color: "bg-red-100 text-red-700",
				urgent: true,
			};
		}

		if (daysRemaining <= 7) {
			return {
				text: `${daysRemaining} days left`,
				color: "bg-orange-100 text-orange-700",
				urgent: true,
			};
		}

		return {
			text: `${daysRemaining} days left`,
			color: "bg-blue-100 text-blue-700",
			urgent: false,
		};
	};

	// Format date for display
	const formatDate = (date: Date | null): string => {
		if (!date) return "No deadline";
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	if (activeCompetitions.length === 0) {
		return (
			<div className={cn("text-center py-12", className)}>
				<Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
				<h3 className="text-lg font-medium text-gray-900 mb-2">
					No Active Competitions
				</h3>
				<p className="text-gray-600">
					There are no active competitions available for submission at the
					moment. Check back later for new opportunities!
				</p>
			</div>
		);
	}

	return (
		<div className={cn("space-y-4", className)}>
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold text-gray-900">Submit Your Photos</h2>
				<span className="text-sm text-gray-500">
					{activeCompetitions.length} active competition
					{activeCompetitions.length !== 1 ? "s" : ""}
				</span>
			</div>

			<div className="grid gap-6">
				{activeCompetitions.map((competition) => {
					const statusInfo = getStatusInfo(competition);

					return (
						<Link
							key={competition.id}
							to={`/submit/${competition.id}`}
							className="block group"
						>
							<div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200">
								{/* Header */}
								<div className="flex items-start justify-between mb-4">
									<div className="flex-1">
										<div className="flex items-center space-x-3 mb-2">
											<h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary">
												{competition.title}
											</h3>
											<span
												className={cn(
													"px-2 py-1 text-xs font-medium rounded-full",
													statusInfo.color,
												)}
											>
												{statusInfo.text}
											</span>
											{statusInfo.urgent && (
												<span className="animate-pulse text-red-500">●</span>
											)}
										</div>
										<p className="text-gray-600 line-clamp-2">
											{competition.description}
										</p>
									</div>
									<ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
								</div>

								{/* Timeline */}
								{(competition.startDate || competition.endDate) && (
									<div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
										<div className="flex items-center space-x-1">
											<Calendar className="h-4 w-4" />
											<span>
												{competition.startDate && competition.endDate
													? `${formatDate(competition.startDate)} - ${formatDate(competition.endDate)}`
													: competition.endDate
														? `Ends ${formatDate(competition.endDate)}`
														: competition.startDate
															? `Started ${formatDate(competition.startDate)}`
															: "No timeline set"}
											</span>
										</div>
									</div>
								)}

								{/* Stats */}
								<div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
									<div className="text-center">
										<p className="text-2xl font-bold text-gray-900">
											{competition.categoryCount}
										</p>
										<p className="text-xs text-gray-600">
											{competition.categoryCount === 1
												? "Category"
												: "Categories"}
										</p>
									</div>
									<div className="text-center">
										<p className="text-2xl font-bold text-primary">
											{competition.userSubmissionCount}
										</p>
										<p className="text-xs text-gray-600">Your Submissions</p>
									</div>
									<div className="text-center">
										<p className="text-2xl font-bold text-gray-900">
											{competition.totalSubmissions}
										</p>
										<p className="text-xs text-gray-600">Total Submissions</p>
									</div>
								</div>

								{/* Action hint */}
								<div className="mt-4 pt-4 border-t border-gray-100">
									<div className="flex items-center justify-between text-sm">
										<span className="text-gray-600">
											Click to view categories and submit photos
										</span>
										<span className="text-primary font-medium">
											Submit Photos →
										</span>
									</div>
								</div>
							</div>
						</Link>
					);
				})}
			</div>
		</div>
	);
}

/**
 * Compact competition card for use in smaller spaces
 */
export interface CompactCompetitionCardProps {
	competition: CompetitionWithStats;
	className?: string;
}

export function CompactCompetitionCard({
	competition,
	className,
}: CompactCompetitionCardProps) {
	const statusInfo = getStatusInfo(competition);

	return (
		<Link
			to={`/submit/${competition.id}`}
			className={cn("block group", className)}
		>
			<div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-gray-300 transition-all duration-200">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<div className="flex items-center space-x-2 mb-1">
							<h4 className="font-semibold text-gray-900 group-hover:text-primary">
								{competition.title}
							</h4>
							<span
								className={cn(
									"px-2 py-0.5 text-xs font-medium rounded-full",
									statusInfo.color,
								)}
							>
								{statusInfo.text}
							</span>
						</div>
						<p className="text-sm text-gray-600 line-clamp-1">
							{competition.description}
						</p>
						<div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
							<span>{competition.categoryCount} categories</span>
							<span>{competition.userSubmissionCount} submitted</span>
						</div>
					</div>
					<ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
				</div>
			</div>
		</Link>
	);
}

// Helper function (duplicated here for component independence)
function getStatusInfo(competition: CompetitionWithStats) {
	const { daysRemaining, status } = competition;

	if (status !== "active") {
		return {
			text: status === "completed" ? "Completed" : "Draft",
			color: "bg-gray-100 text-gray-600",
			urgent: false,
		};
	}

	if (daysRemaining === null) {
		return {
			text: "Active",
			color: "bg-green-100 text-green-700",
			urgent: false,
		};
	}

	if (daysRemaining <= 1) {
		return {
			text: daysRemaining === 0 ? "Ends today" : "1 day left",
			color: "bg-red-100 text-red-700",
			urgent: true,
		};
	}

	if (daysRemaining <= 7) {
		return {
			text: `${daysRemaining} days left`,
			color: "bg-orange-100 text-orange-700",
			urgent: true,
		};
	}

	return {
		text: `${daysRemaining} days left`,
		color: "bg-blue-100 text-blue-700",
		urgent: false,
	};
}
