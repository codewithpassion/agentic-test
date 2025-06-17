import {
	ArrowLeft,
	Calendar,
	Camera,
	CheckCircle,
	Clock,
	MapPin,
	User,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { Badge } from "~/components/ui/badge";
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
import { Input } from "~/components/ui/input";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { Textarea } from "~/components/ui/textarea";
import { trpc } from "~/lib/trpc";

export default function PhotoModerationDetailPage() {
	const { photoId } = useParams();
	const [rejectionReason, setRejectionReason] = useState("");
	const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
	const [actionType, setActionType] = useState<"approve" | "reject" | null>(
		null,
	);

	// Use getForModeration and filter for specific photo
	const {
		data: moderationData,
		isLoading,
		error,
	} = trpc.photos.getForModeration.useQuery({
		limit: 100,
		offset: 0,
	});

	// Find the specific photo from the moderation data
	const photo = moderationData?.photos?.find((p) => p.id === photoId);

	const moderatePhotoMutation = trpc.photos.moderate.useMutation({
		onSuccess: () => {
			setIsActionDialogOpen(false);
			setActionType(null);
			setRejectionReason("");
			// Refresh the photo data
			window.location.reload();
		},
		onError: (error) => {
			alert(`Error: ${error.message}`);
		},
	});

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
				<div className="flex items-center gap-4">
					<Link
						to="/admin/moderation"
						className="flex items-center text-blue-600 hover:text-blue-800"
					>
						<ArrowLeft className="h-4 w-4 mr-1" />
						Back to Moderation
					</Link>
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

	if (!isLoading && !photo) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Link
						to="/admin/moderation"
						className="flex items-center text-blue-600 hover:text-blue-800"
					>
						<ArrowLeft className="h-4 w-4 mr-1" />
						Back to Moderation
					</Link>
				</div>
				<Card>
					<CardContent className="p-6">
						<div className="text-center text-red-600">
							<p>Photo not found in moderation queue</p>
							<p className="text-sm mt-2">Photo ID: {photoId}</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Early return if still loading or photo not found
	if (isLoading || !photo) {
		return (
			<div className="flex items-center justify-center h-64">
				<LoadingSpinner />
			</div>
		);
	}

	const handleModeratePhoto = async () => {
		if (!actionType || !photoId) return;

		try {
			await moderatePhotoMutation.mutateAsync({
				photoId,
				action: actionType,
				reason: actionType === "reject" ? rejectionReason : undefined,
			});
		} catch (error) {
			console.error("Error moderating photo:", error);
		}
	};

	const getStatusDisplay = (status: string) => {
		switch (status) {
			case "pending":
				return {
					icon: <Clock className="h-5 w-5 text-amber-600" />,
					badge: (
						<Badge className="bg-amber-100 text-amber-800">
							Pending Review
						</Badge>
					),
					color: "text-amber-600",
				};
			case "approved":
				return {
					icon: <CheckCircle className="h-5 w-5 text-green-600" />,
					badge: (
						<Badge className="bg-green-100 text-green-800">Approved</Badge>
					),
					color: "text-green-600",
				};
			case "rejected":
				return {
					icon: <XCircle className="h-5 w-5 text-red-600" />,
					badge: <Badge className="bg-red-100 text-red-800">Rejected</Badge>,
					color: "text-red-600",
				};
			default:
				return {
					icon: null,
					badge: <Badge>{status}</Badge>,
					color: "text-gray-600",
				};
		}
	};

	const statusDisplay = getStatusDisplay(photo.status);
	const isPending = photo.status === "pending";

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Link
						to="/admin/moderation"
						className="flex items-center text-blue-600 hover:text-blue-800"
					>
						<ArrowLeft className="h-4 w-4 mr-1" />
						Back to Moderation
					</Link>
					<div className="flex items-center gap-2">
						{statusDisplay.icon}
						{statusDisplay.badge}
					</div>
				</div>

				{isPending && (
					<div className="flex gap-2">
						<Dialog
							open={isActionDialogOpen}
							onOpenChange={setIsActionDialogOpen}
						>
							<DialogTrigger asChild>
								<Button
									variant="outline"
									className="border-red-300 text-red-700 hover:bg-red-50"
									onClick={() => setActionType("reject")}
								>
									<XCircle className="h-4 w-4 mr-2" />
									Reject
								</Button>
							</DialogTrigger>
							<DialogTrigger asChild>
								<Button
									className="bg-green-600 hover:bg-green-700"
									onClick={() => setActionType("approve")}
								>
									<CheckCircle className="h-4 w-4 mr-2" />
									Approve
								</Button>
							</DialogTrigger>

							<DialogContent>
								<DialogHeader>
									<DialogTitle>
										{actionType === "approve"
											? "Approve Photo"
											: "Reject Photo"}
									</DialogTitle>
									<DialogDescription>
										{actionType === "approve"
											? "This photo will be approved and made visible to the public."
											: "This photo will be rejected and hidden from public view."}
									</DialogDescription>
								</DialogHeader>

								<div className="space-y-4">
									{actionType === "reject" && (
										<div>
											<label
												htmlFor="rejection-reason"
												className="text-sm font-medium text-gray-700"
											>
												Rejection Reason *
											</label>
											<Textarea
												id="rejection-reason"
												value={rejectionReason}
												onChange={(e) => setRejectionReason(e.target.value)}
												placeholder="Please provide a reason for rejection..."
												className="mt-1"
												rows={3}
											/>
										</div>
									)}

									<div className="flex justify-end gap-2">
										<Button
											variant="outline"
											onClick={() => {
												setIsActionDialogOpen(false);
												setActionType(null);
												setRejectionReason("");
											}}
										>
											Cancel
										</Button>
										<Button
											onClick={handleModeratePhoto}
											disabled={
												moderatePhotoMutation.isPending ||
												(actionType === "reject" && !rejectionReason.trim())
											}
											className={
												actionType === "approve"
													? "bg-green-600 hover:bg-green-700"
													: "bg-red-600 hover:bg-red-700"
											}
										>
											{moderatePhotoMutation.isPending ? (
												<LoadingSpinner className="h-4 w-4 mr-2" />
											) : actionType === "approve" ? (
												<CheckCircle className="h-4 w-4 mr-2" />
											) : (
												<XCircle className="h-4 w-4 mr-2" />
											)}
											{actionType === "approve" ? "Approve" : "Reject"}
										</Button>
									</div>
								</div>
							</DialogContent>
						</Dialog>
					</div>
				)}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Photo Display */}
				<div className="lg:col-span-2">
					<Card>
						<CardContent className="p-6">
							<div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center mb-4">
								{/* Photo display */}
								{photo.filePath ? (
									<img
										src={`/api/photos/serve/${encodeURIComponent(photo.filePath)}`}
										alt={photo.title}
										className="w-full h-full object-contain rounded-lg"
										onError={(e) => {
											// Fallback to placeholder on error
											const target = e.target as HTMLImageElement;
											target.style.display = "none";
											target.nextElementSibling?.classList.remove("hidden");
										}}
									/>
								) : null}
								{/* Fallback placeholder */}
								<div
									className={`text-gray-400 ${photo.filePath ? "hidden" : ""}`}
								>
									<svg
										className="h-24 w-24"
										fill="currentColor"
										viewBox="0 0 20 20"
										aria-hidden="true"
									>
										<title>Photo placeholder</title>
										<path
											fillRule="evenodd"
											d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
											clipRule="evenodd"
										/>
									</svg>
								</div>
							</div>

							<h1 className="text-2xl font-bold mb-2">{photo.title}</h1>
							<p className="text-gray-600 mb-4">{photo.description}</p>
						</CardContent>
					</Card>
				</div>

				{/* Photo Details */}
				<div className="space-y-6">
					{/* Basic Information */}
					<Card>
						<CardHeader>
							<CardTitle>Photo Details</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center gap-3">
								<User className="h-4 w-4 text-gray-400" />
								<div>
									<p className="text-sm font-medium">Submitted by</p>
									<p className="text-sm text-gray-600">
										{photo.user?.name || "Unknown user"}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-3">
								<Calendar className="h-4 w-4 text-gray-400" />
								<div>
									<p className="text-sm font-medium">Date taken</p>
									<p className="text-sm text-gray-600">
										{photo.dateTaken
											? new Date(photo.dateTaken).toLocaleDateString()
											: "Not specified"}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-3">
								<MapPin className="h-4 w-4 text-gray-400" />
								<div>
									<p className="text-sm font-medium">Location</p>
									<p className="text-sm text-gray-600">{photo.location}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Competition & Category */}
					<Card>
						<CardHeader>
							<CardTitle>Competition Info</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<p className="text-sm font-medium">Competition</p>
								<p className="text-sm text-gray-600">
									{photo.competition?.title}
								</p>
							</div>
							<div>
								<p className="text-sm font-medium">Category</p>
								<p className="text-sm text-gray-600">{photo.category?.name}</p>
							</div>
							<div>
								<p className="text-sm font-medium">Submitted</p>
								<p className="text-sm text-gray-600">
									{new Date(photo.createdAt).toLocaleDateString()}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Camera Information */}
					{(photo.cameraMake ||
						photo.cameraModel ||
						photo.lens ||
						photo.focalLength ||
						photo.aperture ||
						photo.shutterSpeed ||
						photo.iso) && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center">
									<Camera className="h-4 w-4 mr-2" />
									Camera Info
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								{photo.cameraMake && (
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Make:</span>
										<span className="text-sm font-medium">
											{photo.cameraMake}
										</span>
									</div>
								)}
								{photo.cameraModel && (
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Model:</span>
										<span className="text-sm font-medium">
											{photo.cameraModel}
										</span>
									</div>
								)}
								{photo.lens && (
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Lens:</span>
										<span className="text-sm font-medium">{photo.lens}</span>
									</div>
								)}
								{photo.focalLength && (
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Focal Length:</span>
										<span className="text-sm font-medium">
											{photo.focalLength}
										</span>
									</div>
								)}
								{photo.aperture && (
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Aperture:</span>
										<span className="text-sm font-medium">
											{photo.aperture}
										</span>
									</div>
								)}
								{photo.shutterSpeed && (
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">
											Shutter Speed:
										</span>
										<span className="text-sm font-medium">
											{photo.shutterSpeed}
										</span>
									</div>
								)}
								{photo.iso && (
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">ISO:</span>
										<span className="text-sm font-medium">{photo.iso}</span>
									</div>
								)}
							</CardContent>
						</Card>
					)}

					{/* Moderation History */}
					{!isPending && (
						<Card>
							<CardHeader>
								<CardTitle>Moderation History</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<p className="text-sm font-medium">Status</p>
									<p className={`text-sm ${statusDisplay.color} capitalize`}>
										{photo.status}
									</p>
								</div>
								{photo.moderatedAt && (
									<div>
										<p className="text-sm font-medium">Moderated on</p>
										<p className="text-sm text-gray-600">
											{new Date(photo.moderatedAt).toLocaleDateString()}
										</p>
									</div>
								)}
								{photo.moderatedBy && (
									<div>
										<p className="text-sm font-medium">Moderated by</p>
										<p className="text-sm text-gray-600">
											{photo.moderatedByUser?.name || "Unknown moderator"}
										</p>
									</div>
								)}
								{photo.rejectionReason && (
									<div>
										<p className="text-sm font-medium">Rejection reason</p>
										<p className="text-sm text-red-600">
											{photo.rejectionReason}
										</p>
									</div>
								)}
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}

export function meta() {
	return [
		{ title: "Photo Details - Photo Moderation" },
		{ name: "description", content: "Review individual photo submission" },
	];
}
