import { CheckCircle, Clock, XCircle } from "lucide-react";
import { useState } from "react";
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
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";

interface Photo {
	id: string;
	title: string;
	status: "pending" | "approved" | "rejected";
	createdAt: Date;
	filePath?: string;
	user?: {
		id: string;
		name?: string;
	};
	competition?: {
		id: string;
		title: string;
	};
	category?: {
		id: string;
		name: string;
	};
	moderatedAt?: Date;
	moderatedBy?: string;
	rejectionReason?: string;
}

interface PhotoModerationCardProps {
	photo: Photo;
	onClick?: (photoId: string) => void;
	onModerate?: (
		photoId: string,
		action: "approve" | "reject",
		reason?: string,
	) => void;
	showModerationActions?: boolean;
	className?: string;
}

export function PhotoModerationCard({
	photo,
	onClick,
	onModerate,
	showModerationActions = true,
	className,
}: PhotoModerationCardProps) {
	const [rejectionReason, setRejectionReason] = useState("");
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const getStatusDisplay = (status: string) => {
		switch (status) {
			case "pending":
				return {
					icon: <Clock className="h-4 w-4 text-amber-600" />,
					badge: <Badge className="bg-amber-100 text-amber-800">Pending</Badge>,
					color: "text-amber-600",
				};
			case "approved":
				return {
					icon: <CheckCircle className="h-4 w-4 text-green-600" />,
					badge: (
						<Badge className="bg-green-100 text-green-800">Approved</Badge>
					),
					color: "text-green-600",
				};
			case "rejected":
				return {
					icon: <XCircle className="h-4 w-4 text-red-600" />,
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

	const handleModeratePhoto = (action: "approve" | "reject") => {
		if (!onModerate) return;

		if (action === "reject" && !rejectionReason.trim()) {
			alert("Please provide a rejection reason");
			return;
		}

		onModerate(
			photo.id,
			action,
			action === "reject" ? rejectionReason : undefined,
		);
		setIsDialogOpen(false);
		setRejectionReason("");
	};

	const handleCardClick = () => {
		if (onClick) {
			onClick(photo.id);
		}
	};

	console.log("Rendering PhotoModerationCard for photo:", photo.filePath);

	return (
		<Card className={cn("overflow-hidden", className)}>
			{/* Photo Thumbnail */}

			<div
				className="aspect-video bg-gray-200 flex items-center justify-center relative cursor-pointer hover:bg-gray-300 transition-colors"
				onClick={handleCardClick}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						handleCardClick();
					}
				}}
				/* biome-ignore lint/a11y/useSemanticElements: Keeps consistent card layout */
				role="button"
				tabIndex={0}
				aria-label={`View photo: ${photo.title}`}
			>
				{/* Photo thumbnail */}
				{photo.filePath ? (
					<img
						src={`/api/photos/serve/${encodeURIComponent(photo.filePath)}`}
						alt={photo.title}
						className="w-full h-full object-cover"
						onError={(e) => {
							// Fallback to placeholder on error
							const target = e.target as HTMLImageElement;
							target.style.display = "none";
							target.nextElementSibling?.classList.remove("hidden");
						}}
					/>
				) : null}
				{/* Fallback placeholder */}
				<div className={`text-gray-400 ${photo.filePath ? "hidden" : ""}`}>
					<svg
						className="h-12 w-12"
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

				{/* Status badge overlay */}
				<div className="absolute top-2 right-2">{statusDisplay.badge}</div>
			</div>

			{/* Photo Information */}
			<CardHeader className="pb-2">
				<CardTitle className="text-sm truncate" title={photo.title}>
					{photo.title}
				</CardTitle>
				<div className="space-y-1 text-xs text-gray-600">
					<p>By: {photo.user?.name || "Unknown user"}</p>
					<p>Competition: {photo.competition?.title}</p>
					<p>Category: {photo.category?.name}</p>
					<p className="text-gray-400">
						Submitted: {new Date(photo.createdAt).toLocaleDateString()}
					</p>
					{photo.moderatedAt && (
						<p className="text-gray-400">
							Moderated: {new Date(photo.moderatedAt).toLocaleDateString()}
						</p>
					)}
				</div>
			</CardHeader>

			{/* Actions */}
			<CardContent className="pt-0">
				{/* Status Display */}
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center">
						{statusDisplay.icon}
						<span
							className={cn(
								"text-xs font-medium ml-1 capitalize",
								statusDisplay.color,
							)}
						>
							{photo.status}
						</span>
					</div>
					<button
						type="button"
						onClick={handleCardClick}
						className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
					>
						{isPending ? "Review" : "View"}
					</button>
				</div>

				{/* Moderation Actions for Pending Photos */}
				{isPending && showModerationActions && onModerate && (
					<div className="flex gap-2">
						<Button
							size="sm"
							variant="outline"
							className="flex-1 border-green-300 text-green-700 hover:bg-green-50 text-xs"
							onClick={() => handleModeratePhoto("approve")}
						>
							<CheckCircle className="h-3 w-3 mr-1" />
							Approve
						</Button>

						<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
							<DialogTrigger asChild>
								<Button
									size="sm"
									variant="outline"
									className="flex-1 border-red-300 text-red-700 hover:bg-red-50 text-xs"
								>
									<XCircle className="h-3 w-3 mr-1" />
									Reject
								</Button>
							</DialogTrigger>

							<DialogContent>
								<DialogHeader>
									<DialogTitle>Reject Photo</DialogTitle>
									<DialogDescription>
										Please provide a reason for rejecting "{photo.title}".
									</DialogDescription>
								</DialogHeader>

								<div className="space-y-4">
									<div>
										<label
											htmlFor="card-rejection-reason"
											className="text-sm font-medium text-gray-700"
										>
											Rejection Reason *
										</label>
										<Textarea
											id="card-rejection-reason"
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
												setIsDialogOpen(false);
												setRejectionReason("");
											}}
										>
											Cancel
										</Button>
										<Button
											onClick={() => handleModeratePhoto("reject")}
											disabled={!rejectionReason.trim()}
											className="bg-red-600 hover:bg-red-700"
										>
											<XCircle className="h-4 w-4 mr-2" />
											Reject Photo
										</Button>
									</div>
								</div>
							</DialogContent>
						</Dialog>
					</div>
				)}

				{/* Rejection Reason Display */}
				{photo.rejectionReason && (
					<div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
						<p className="text-red-800 font-medium">Rejection reason:</p>
						<p className="text-red-700">{photo.rejectionReason}</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
