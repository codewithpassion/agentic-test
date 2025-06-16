/**
 * Category selector component for competition submission
 */

import { AlertCircle, Camera, CheckCircle, Clock, Upload } from "lucide-react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";
import type { Category, Competition } from "../../../api/database/schema";

export interface CategoryWithStats extends Category {
	userSubmissionCount: number;
	totalSubmissions: number;
	canSubmit: boolean;
	remainingSlots: number;
}

export interface CategorySelectorProps {
	competition: Competition;
	categories: CategoryWithStats[];
	className?: string;
}

export function CategorySelector({
	competition,
	categories,
	className,
}: CategorySelectorProps) {
	// Format date for display
	const formatDate = (date: Date | null): string => {
		if (!date) return "No deadline";
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	// Calculate days remaining
	const getDaysRemaining = (): number | null => {
		if (!competition.endDate) return null;
		const now = new Date();
		const end = new Date(competition.endDate);
		const diffTime = end.getTime() - now.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return Math.max(0, diffDays);
	};

	const daysRemaining = getDaysRemaining();

	return (
		<div className={cn("space-y-6", className)}>
			{/* Competition Header */}
			<div className="bg-white border border-gray-200 rounded-lg p-6">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<h1 className="text-2xl font-bold text-gray-900 mb-2">
							{competition.title}
						</h1>
						<p className="text-gray-600 mb-4">{competition.description}</p>

						{/* Timeline */}
						<div className="flex items-center space-x-6 text-sm text-gray-600">
							{competition.startDate && (
								<div className="flex items-center space-x-1">
									<Clock className="h-4 w-4" />
									<span>Started {formatDate(competition.startDate)}</span>
								</div>
							)}
							{competition.endDate && (
								<div className="flex items-center space-x-1">
									<AlertCircle className="h-4 w-4" />
									<span>Ends {formatDate(competition.endDate)}</span>
								</div>
							)}
							{daysRemaining !== null && (
								<div
									className={cn(
										"flex items-center space-x-1",
										daysRemaining <= 1
											? "text-red-600"
											: daysRemaining <= 7
												? "text-orange-600"
												: "text-blue-600",
									)}
								>
									<span className="font-medium">
										{daysRemaining === 0
											? "Ends today!"
											: `${daysRemaining} days remaining`}
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Competition Status */}
					<div className="text-right">
						<span
							className={cn(
								"inline-block px-3 py-1 text-sm font-medium rounded-full",
								competition.status === "active"
									? "bg-green-100 text-green-700"
									: competition.status === "completed"
										? "bg-gray-100 text-gray-700"
										: "bg-yellow-100 text-yellow-700",
							)}
						>
							{competition.status === "active"
								? "Active"
								: competition.status === "completed"
									? "Completed"
									: "Draft"}
						</span>
					</div>
				</div>
			</div>

			{/* Categories */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-semibold text-gray-900">
						Choose a Category
					</h2>
					<span className="text-sm text-gray-500">
						{categories.length} categor{categories.length !== 1 ? "ies" : "y"}{" "}
						available
					</span>
				</div>

				{categories.length === 0 ? (
					<div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
						<Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-gray-900 mb-2">
							No Categories Available
						</h3>
						<p className="text-gray-600">
							This competition doesn't have any categories set up yet.
						</p>
					</div>
				) : (
					<div className="grid gap-4">
						{categories.map((category) => {
							const progressPercentage =
								category.maxPhotosPerUser > 0
									? (category.userSubmissionCount / category.maxPhotosPerUser) *
										100
									: 0;

							return (
								<div
									key={category.id}
									className={cn(
										"bg-white border rounded-lg p-6 transition-all duration-200",
										category.canSubmit
											? "border-gray-200 hover:shadow-lg hover:border-gray-300"
											: "border-gray-100 bg-gray-50",
									)}
								>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											{/* Category Header */}
											<div className="flex items-center space-x-3 mb-3">
												<h3 className="text-lg font-semibold text-gray-900">
													{category.name}
												</h3>

												{/* Status Icons */}
												{category.userSubmissionCount >=
												category.maxPhotosPerUser ? (
													<div className="flex items-center space-x-1 text-green-600">
														<CheckCircle className="h-4 w-4" />
														<span className="text-sm font-medium">
															Complete
														</span>
													</div>
												) : category.canSubmit ? (
													<div className="flex items-center space-x-1 text-blue-600">
														<Upload className="h-4 w-4" />
														<span className="text-sm font-medium">
															Available
														</span>
													</div>
												) : (
													<div className="flex items-center space-x-1 text-gray-500">
														<AlertCircle className="h-4 w-4" />
														<span className="text-sm font-medium">
															Unavailable
														</span>
													</div>
												)}
											</div>

											{/* Submission Progress */}
											<div className="mb-4">
												<div className="flex items-center justify-between text-sm text-gray-600 mb-1">
													<span>Your submissions</span>
													<span>
														{category.userSubmissionCount} /{" "}
														{category.maxPhotosPerUser}
													</span>
												</div>
												<div className="w-full bg-gray-200 rounded-full h-2">
													<div
														className={cn(
															"h-2 rounded-full transition-all duration-300",
															progressPercentage >= 100
																? "bg-green-500"
																: "bg-blue-500",
														)}
														style={{
															width: `${Math.min(100, progressPercentage)}%`,
														}}
													/>
												</div>
												<p className="text-xs text-gray-500 mt-1">
													{category.remainingSlots > 0
														? `${category.remainingSlots} slot${category.remainingSlots !== 1 ? "s" : ""} remaining`
														: "All slots filled"}
												</p>
											</div>

											{/* Category Stats */}
											<div className="flex items-center space-x-6 text-sm text-gray-600">
												<div>
													<span className="font-medium">
														{category.totalSubmissions}
													</span>
													<span className="ml-1">total submissions</span>
												</div>
												<div>
													<span className="font-medium">
														{category.maxPhotosPerUser}
													</span>
													<span className="ml-1">max per user</span>
												</div>
											</div>
										</div>

										{/* Action Button */}
										<div className="ml-6">
											{category.canSubmit ? (
												<Link
													to={`/submit/${competition.id}/${category.id}`}
													className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
												>
													<Upload className="h-4 w-4" />
													<span>Upload Photos</span>
												</Link>
											) : category.userSubmissionCount >=
												category.maxPhotosPerUser ? (
												<div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
													<CheckCircle className="h-4 w-4" />
													<span>Completed</span>
												</div>
											) : (
												<div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg">
													<AlertCircle className="h-4 w-4" />
													<span>Not Available</span>
												</div>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Overall Progress Summary */}
			{categories.length > 0 && (
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 className="font-medium text-blue-900 mb-2">Submission Summary</h3>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
						<div>
							<span className="text-blue-700">Total Categories:</span>
							<span className="font-medium text-blue-900 ml-2">
								{categories.length}
							</span>
						</div>
						<div>
							<span className="text-blue-700">Your Submissions:</span>
							<span className="font-medium text-blue-900 ml-2">
								{categories.reduce(
									(sum, cat) => sum + cat.userSubmissionCount,
									0,
								)}
							</span>
						</div>
						<div>
							<span className="text-blue-700">Completed Categories:</span>
							<span className="font-medium text-blue-900 ml-2">
								{
									categories.filter(
										(cat) => cat.userSubmissionCount >= cat.maxPhotosPerUser,
									).length
								}
							</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
