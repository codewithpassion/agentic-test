/**
 * User submission statistics component
 */

import {
	Award,
	Calendar,
	CheckCircle,
	Clock,
	Trophy,
	XCircle,
} from "lucide-react";
import { cn } from "~/lib/utils";

export interface SubmissionStatsProps {
	totalSubmissions: number;
	pendingSubmissions: number;
	approvedSubmissions: number;
	rejectedSubmissions: number;
	competitionsEntered: number;
	recentActivity?: Array<{
		id: string;
		title: string;
		status: string;
		createdAt: Date | null;
		competitionTitle: string;
		categoryName: string;
	}>;
}

export function SubmissionStats({
	totalSubmissions,
	pendingSubmissions,
	approvedSubmissions,
	rejectedSubmissions,
	competitionsEntered,
	recentActivity = [],
}: SubmissionStatsProps) {
	// Calculate approval rate
	const approvalRate =
		totalSubmissions > 0
			? Math.round((approvedSubmissions / totalSubmissions) * 100)
			: 0;

	// Stat items configuration
	const stats = [
		{
			id: "total",
			label: "Total Submissions",
			value: totalSubmissions,
			icon: Award,
			color: "text-blue-600",
			bgColor: "bg-blue-50",
		},
		{
			id: "pending",
			label: "Under Review",
			value: pendingSubmissions,
			icon: Clock,
			color: "text-orange-600",
			bgColor: "bg-orange-50",
		},
		{
			id: "approved",
			label: "Approved",
			value: approvedSubmissions,
			icon: CheckCircle,
			color: "text-green-600",
			bgColor: "bg-green-50",
		},
		{
			id: "rejected",
			label: "Rejected",
			value: rejectedSubmissions,
			icon: XCircle,
			color: "text-red-600",
			bgColor: "bg-red-50",
		},
		{
			id: "competitions",
			label: "Competitions Entered",
			value: competitionsEntered,
			icon: Trophy,
			color: "text-purple-600",
			bgColor: "bg-purple-50",
		},
	];

	// Format date for recent activity
	const formatDate = (date: Date | null): string => {
		if (!date) return "Unknown";
		return new Date(date).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});
	};

	// Get status badge info
	const getStatusInfo = (status: string) => {
		switch (status) {
			case "approved":
				return { text: "Approved", color: "bg-green-100 text-green-700" };
			case "rejected":
				return { text: "Rejected", color: "bg-red-100 text-red-700" };
			case "pending":
				return { text: "Under Review", color: "bg-orange-100 text-orange-700" };
			default:
				return { text: status, color: "bg-gray-100 text-gray-700" };
		}
	};

	return (
		<div className="space-y-6 mb-8">
			{/* Main Statistics Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
				{stats.map((stat) => {
					const Icon = stat.icon;
					return (
						<div
							key={stat.id}
							className="bg-white border border-gray-200 rounded-lg p-6"
						>
							<div className="flex items-center">
								<div className={cn("rounded-lg p-2", stat.bgColor)}>
									<Icon className={cn("h-5 w-5", stat.color)} />
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-600">
										{stat.label}
									</p>
									<p className="text-2xl font-bold text-gray-900">
										{stat.value}
									</p>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Approval Rate and Recent Activity */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Approval Rate */}
				<div className="bg-white border border-gray-200 rounded-lg p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold text-gray-900">
							Approval Rate
						</h3>
						<div className="text-2xl font-bold text-gray-900">
							{approvalRate}%
						</div>
					</div>

					{/* Progress Bar */}
					<div className="w-full bg-gray-200 rounded-full h-2 mb-4">
						<div
							className={cn(
								"h-2 rounded-full transition-all duration-300",
								approvalRate >= 80
									? "bg-green-500"
									: approvalRate >= 60
										? "bg-yellow-500"
										: "bg-red-500",
							)}
							style={{ width: `${approvalRate}%` }}
						/>
					</div>

					{/* Breakdown */}
					{totalSubmissions > 0 && (
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-gray-600">Approved:</span>
								<span className="font-medium text-green-600">
									{approvedSubmissions}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">Rejected:</span>
								<span className="font-medium text-red-600">
									{rejectedSubmissions}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">Pending:</span>
								<span className="font-medium text-orange-600">
									{pendingSubmissions}
								</span>
							</div>
						</div>
					)}
				</div>

				{/* Recent Activity */}
				<div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
					<div className="flex items-center space-x-2 mb-4">
						<Calendar className="h-5 w-5 text-gray-400" />
						<h3 className="text-lg font-semibold text-gray-900">
							Recent Activity
						</h3>
					</div>

					{recentActivity.length === 0 ? (
						<div className="text-center py-6">
							<p className="text-gray-500">No recent activity</p>
						</div>
					) : (
						<div className="space-y-3">
							{recentActivity.map((activity) => {
								const statusInfo = getStatusInfo(activity.status);
								return (
									<div
										key={activity.id}
										className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
									>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-gray-900 truncate">
												{activity.title}
											</p>
											<p className="text-xs text-gray-600">
												{activity.competitionTitle} • {activity.categoryName}
											</p>
										</div>
										<div className="flex items-center space-x-3 ml-4">
											<span
												className={cn(
													"px-2 py-1 text-xs font-medium rounded-full",
													statusInfo.color,
												)}
											>
												{statusInfo.text}
											</span>
											<span className="text-xs text-gray-500">
												{formatDate(activity.createdAt)}
											</span>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
