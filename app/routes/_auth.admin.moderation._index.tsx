import { CheckCircle, Clock, Eye, Flag, Image, XCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { Textarea } from "~/components/ui/textarea";
import { trpc } from "~/lib/trpc";

export default function AdminModerationPage() {
	const [rejectionReason, setRejectionReason] = useState("");
	const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
	const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

	const {
		data: moderationStats,
		isLoading,
		error,
		refetch,
	} = trpc.photos.getForModeration.useQuery({
		limit: 100, // Get all for stats
		offset: 0,
	});

	const moderatePhotoMutation = trpc.photos.moderate.useMutation({
		onSuccess: () => {
			setIsRejectDialogOpen(false);
			setSelectedPhotoId(null);
			setRejectionReason("");
			// Refresh the data
			refetch();
		},
		onError: (error) => {
			alert(`Error: ${error.message}`);
		},
	});

	const handleApprove = async (photoId: string) => {
		try {
			await moderatePhotoMutation.mutateAsync({
				photoId,
				action: "approve",
			});
		} catch (error) {
			console.error("Error approving photo:", error);
		}
	};

	const handleReject = async () => {
		if (!selectedPhotoId || !rejectionReason.trim()) return;

		try {
			await moderatePhotoMutation.mutateAsync({
				photoId: selectedPhotoId,
				action: "reject",
				reason: rejectionReason,
			});
		} catch (error) {
			console.error("Error rejecting photo:", error);
		}
	};

	const openRejectDialog = (photoId: string) => {
		setSelectedPhotoId(photoId);
		setIsRejectDialogOpen(true);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<LoadingSpinner />
			</div>
		);
	}

	if (error) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl font-bold">Photo Moderation</h1>
					<p className="text-gray-600">Review and moderate photo submissions</p>
				</div>
				<Card>
					<CardContent className="p-6">
						<div className="text-center text-red-600">
							<p>Error loading moderation data: {error.message}</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Calculate stats from the data
	const pendingCount =
		moderationStats?.photos?.filter((p) => p.status === "pending").length || 0;
	const approvedCount =
		moderationStats?.photos?.filter((p) => p.status === "approved").length || 0;
	const rejectedCount =
		moderationStats?.photos?.filter((p) => p.status === "rejected").length || 0;
	const totalCount = moderationStats?.total || 0;

	const recentPending =
		moderationStats?.photos
			?.filter((p) => p.status === "pending")
			.slice(0, 5) || [];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Photo Moderation</h1>
				<p className="text-gray-600">Review and moderate photo submissions</p>
			</div>

			{/* Stats Overview */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<Clock className="h-8 w-8 text-amber-600" />
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600">
									Pending Review
								</p>
								<p className="text-2xl font-bold text-amber-600">
									{pendingCount}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<CheckCircle className="h-8 w-8 text-green-600" />
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600">Approved</p>
								<p className="text-2xl font-bold text-green-600">
									{approvedCount}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<XCircle className="h-8 w-8 text-red-600" />
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600">Rejected</p>
								<p className="text-2xl font-bold text-red-600">
									{rejectedCount}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<Image className="h-8 w-8 text-blue-600" />
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600">
									Total Photos
								</p>
								<p className="text-2xl font-bold text-blue-600">{totalCount}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Quick Actions */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center">
							<Clock className="h-5 w-5 mr-2 text-amber-600" />
							Review Pending Photos
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-gray-600 mb-4">
							{pendingCount > 0
								? `${pendingCount} photos are waiting for your review`
								: "No photos pending review"}
						</p>
						<Link
							to="/admin/moderation/pending"
							className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
						>
							<Eye className="h-4 w-4 mr-2" />
							Review Pending ({pendingCount})
						</Link>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center">
							<Image className="h-5 w-5 mr-2 text-blue-600" />
							Browse All Photos
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-gray-600 mb-4">
							Browse and filter all photos by status, competition, or date
						</p>
						<Link
							to="/admin/moderation/photos"
							className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
						>
							<Image className="h-4 w-4 mr-2" />
							Browse All Photos
						</Link>
					</CardContent>
				</Card>
			</div>

			{/* Recent Pending Photos */}
			{recentPending.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Recent Pending Photos</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{recentPending.map((photo) => (
								<div
									key={photo.id}
									className="flex items-center space-x-4 p-4 border rounded-lg"
								>
									<div className="flex-shrink-0">
										<div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
											{photo.filePath ? (
												<img
													src={`/api/photos/serve/${encodeURIComponent(photo.filePath)}`}
													alt={photo.title}
													className="w-full h-full object-cover rounded-lg"
													onError={(e) => {
														// Fallback to placeholder on error
														const target = e.target as HTMLImageElement;
														target.style.display = "none";
														target.nextElementSibling?.classList.remove(
															"hidden",
														);
													}}
												/>
											) : null}
											{/* Fallback placeholder */}
											<div className={`${photo.filePath ? "hidden" : ""}`}>
												<Image className="h-8 w-8 text-gray-400" />
											</div>
										</div>
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-gray-900 truncate">
											{photo.title}
										</p>
										<p className="text-sm text-gray-500">
											{photo.user?.name || "Unknown user"} •{" "}
											{photo.competition?.title}
										</p>
										<p className="text-xs text-gray-400">
											Submitted {new Date(photo.createdAt).toLocaleDateString()}
										</p>
									</div>
									<div className="flex-shrink-0">
										<div className="flex items-center gap-2">
											<Button
												size="sm"
												variant="outline"
												className="border-green-300 text-green-700 hover:bg-green-50 h-8 px-2"
												onClick={() => handleApprove(photo.id)}
												disabled={moderatePhotoMutation.isPending}
											>
												<CheckCircle className="h-3 w-3 mr-1" />
												Approve
											</Button>
											<Button
												size="sm"
												variant="outline"
												className="border-red-300 text-red-700 hover:bg-red-50 h-8 px-2"
												onClick={() => openRejectDialog(photo.id)}
												disabled={moderatePhotoMutation.isPending}
											>
												<XCircle className="h-3 w-3 mr-1" />
												Reject
											</Button>
											<Link
												to={`/admin/moderation/${photo.id}`}
												className="text-blue-600 hover:text-blue-800 text-sm font-medium ml-2"
											>
												Details
											</Link>
										</div>
									</div>
								</div>
							))}
						</div>
						{pendingCount > 5 && (
							<div className="mt-4 text-center">
								<Link
									to="/admin/moderation/pending"
									className="text-blue-600 hover:text-blue-800 text-sm font-medium"
								>
									View all {pendingCount} pending photos →
								</Link>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Rejection Dialog */}
			<Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reject Photo</DialogTitle>
						<DialogDescription>
							Please provide a reason for rejecting this photo.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div>
							<label
								htmlFor="index-rejection-reason"
								className="text-sm font-medium text-gray-700"
							>
								Rejection Reason *
							</label>
							<Textarea
								id="index-rejection-reason"
								value={rejectionReason}
								onChange={(e) => setRejectionReason(e.target.value)}
								placeholder="Please provide a detailed reason for rejection..."
								className="mt-1"
								rows={3}
							/>
						</div>

						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => {
									setIsRejectDialogOpen(false);
									setSelectedPhotoId(null);
									setRejectionReason("");
								}}
							>
								Cancel
							</Button>
							<Button
								onClick={handleReject}
								disabled={
									!rejectionReason.trim() || moderatePhotoMutation.isPending
								}
								className="bg-red-600 hover:bg-red-700"
							>
								{moderatePhotoMutation.isPending ? (
									<LoadingSpinner className="h-4 w-4 mr-2" />
								) : (
									<XCircle className="h-4 w-4 mr-2" />
								)}
								Reject Photo
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export function meta() {
	return [
		{ title: "Photo Moderation - Admin Dashboard" },
		{ name: "description", content: "Moderate photo submissions" },
	];
}
