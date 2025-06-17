import { CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
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

export interface ModerationAction {
	type: "approve" | "reject";
	reason?: string;
}

interface ModerationActionsProps {
	photoId: string;
	photoTitle: string;
	onModerate: (
		photoId: string,
		action: "approve" | "reject",
		reason?: string,
	) => void;
	isLoading?: boolean;
	disabled?: boolean;
	className?: string;
	variant?: "default" | "compact";
}

export function ModerationActions({
	photoId,
	photoTitle,
	onModerate,
	isLoading = false,
	disabled = false,
	className,
	variant = "default",
}: ModerationActionsProps) {
	const [rejectionReason, setRejectionReason] = useState("");
	const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
	const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);

	const handleApprove = () => {
		onModerate(photoId, "approve");
		setIsApproveDialogOpen(false);
	};

	const handleReject = () => {
		if (!rejectionReason.trim()) {
			return;
		}
		onModerate(photoId, "reject", rejectionReason);
		setIsRejectDialogOpen(false);
		setRejectionReason("");
	};

	const isCompact = variant === "compact";

	if (isCompact) {
		return (
			<div className={`flex gap-2 ${className}`}>
				{/* Quick Approve */}
				<Button
					size="sm"
					disabled={disabled || isLoading}
					onClick={() => onModerate(photoId, "approve")}
					className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
				>
					{isLoading ? (
						<LoadingSpinner className="h-3 w-3 mr-1" />
					) : (
						<CheckCircle className="h-3 w-3 mr-1" />
					)}
					Approve
				</Button>

				{/* Reject with Dialog */}
				<Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
					<DialogTrigger asChild>
						<Button
							size="sm"
							variant="outline"
							disabled={disabled || isLoading}
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
								Please provide a reason for rejecting "{photoTitle}".
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4">
							<div>
								<label
									htmlFor="compact-rejection-reason"
									className="text-sm font-medium text-gray-700"
								>
									Rejection Reason *
								</label>
								<Textarea
									id="compact-rejection-reason"
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
										setRejectionReason("");
									}}
								>
									Cancel
								</Button>
								<Button
									onClick={handleReject}
									disabled={!rejectionReason.trim() || isLoading}
									className="bg-red-600 hover:bg-red-700"
								>
									{isLoading ? (
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

	return (
		<div className={`flex gap-4 ${className}`}>
			{/* Approve Button with Confirmation */}
			<Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
				<DialogTrigger asChild>
					<Button
						disabled={disabled || isLoading}
						className="bg-green-600 hover:bg-green-700"
					>
						<CheckCircle className="h-4 w-4 mr-2" />
						Approve Photo
					</Button>
				</DialogTrigger>

				<DialogContent>
					<DialogHeader>
						<DialogTitle>Approve Photo</DialogTitle>
						<DialogDescription>
							Are you sure you want to approve "{photoTitle}"? This photo will
							be made visible to the public.
						</DialogDescription>
					</DialogHeader>

					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => setIsApproveDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleApprove}
							disabled={isLoading}
							className="bg-green-600 hover:bg-green-700"
						>
							{isLoading ? (
								<LoadingSpinner className="h-4 w-4 mr-2" />
							) : (
								<CheckCircle className="h-4 w-4 mr-2" />
							)}
							Approve Photo
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Reject Button with Reason */}
			<Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
				<DialogTrigger asChild>
					<Button
						variant="outline"
						disabled={disabled || isLoading}
						className="border-red-300 text-red-700 hover:bg-red-50"
					>
						<XCircle className="h-4 w-4 mr-2" />
						Reject Photo
					</Button>
				</DialogTrigger>

				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reject Photo</DialogTitle>
						<DialogDescription>
							Please provide a reason for rejecting "{photoTitle}". This will
							help the user understand why their submission was not approved.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div>
							<label
								htmlFor="full-rejection-reason"
								className="text-sm font-medium text-gray-700"
							>
								Rejection Reason *
							</label>
							<Textarea
								id="full-rejection-reason"
								value={rejectionReason}
								onChange={(e) => setRejectionReason(e.target.value)}
								placeholder="Please provide a detailed reason for rejection (e.g., does not meet competition guidelines, poor image quality, inappropriate content, etc.)"
								className="mt-1"
								rows={4}
							/>
							<p className="text-xs text-gray-500 mt-1">
								This reason will be shown to the user who submitted the photo.
							</p>
						</div>

						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => {
									setIsRejectDialogOpen(false);
									setRejectionReason("");
								}}
							>
								Cancel
							</Button>
							<Button
								onClick={handleReject}
								disabled={!rejectionReason.trim() || isLoading}
								className="bg-red-600 hover:bg-red-700"
							>
								{isLoading ? (
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

// Bulk moderation actions for multiple photos
interface BulkModerationActionsProps {
	selectedPhotoIds: string[];
	onBulkModerate: (
		photoIds: string[],
		action: "approve" | "reject",
		reason?: string,
	) => void;
	isLoading?: boolean;
	disabled?: boolean;
	className?: string;
}

export function BulkModerationActions({
	selectedPhotoIds,
	onBulkModerate,
	isLoading = false,
	disabled = false,
	className,
}: BulkModerationActionsProps) {
	const [rejectionReason, setRejectionReason] = useState("");
	const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
	const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);

	const handleBulkApprove = () => {
		onBulkModerate(selectedPhotoIds, "approve");
		setIsApproveDialogOpen(false);
	};

	const handleBulkReject = () => {
		if (!rejectionReason.trim()) {
			return;
		}
		onBulkModerate(selectedPhotoIds, "reject", rejectionReason);
		setIsRejectDialogOpen(false);
		setRejectionReason("");
	};

	if (selectedPhotoIds.length === 0) {
		return null;
	}

	return (
		<div className={`flex gap-4 ${className}`}>
			{/* Bulk Approve */}
			<Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
				<DialogTrigger asChild>
					<Button
						disabled={disabled || isLoading}
						className="bg-green-600 hover:bg-green-700"
					>
						<CheckCircle className="h-4 w-4 mr-2" />
						Approve Selected ({selectedPhotoIds.length})
					</Button>
				</DialogTrigger>

				<DialogContent>
					<DialogHeader>
						<DialogTitle>Bulk Approve Photos</DialogTitle>
						<DialogDescription>
							Are you sure you want to approve {selectedPhotoIds.length}{" "}
							selected photo{selectedPhotoIds.length !== 1 ? "s" : ""}? These
							photos will be made visible to the public.
						</DialogDescription>
					</DialogHeader>

					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => setIsApproveDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleBulkApprove}
							disabled={isLoading}
							className="bg-green-600 hover:bg-green-700"
						>
							{isLoading ? (
								<LoadingSpinner className="h-4 w-4 mr-2" />
							) : (
								<CheckCircle className="h-4 w-4 mr-2" />
							)}
							Approve {selectedPhotoIds.length} Photo
							{selectedPhotoIds.length !== 1 ? "s" : ""}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Bulk Reject */}
			<Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
				<DialogTrigger asChild>
					<Button
						variant="outline"
						disabled={disabled || isLoading}
						className="border-red-300 text-red-700 hover:bg-red-50"
					>
						<XCircle className="h-4 w-4 mr-2" />
						Reject Selected ({selectedPhotoIds.length})
					</Button>
				</DialogTrigger>

				<DialogContent>
					<DialogHeader>
						<DialogTitle>Bulk Reject Photos</DialogTitle>
						<DialogDescription>
							Please provide a reason for rejecting {selectedPhotoIds.length}{" "}
							selected photo{selectedPhotoIds.length !== 1 ? "s" : ""}. This
							reason will be applied to all selected photos.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div>
							<label
								htmlFor="bulk-rejection-reason"
								className="text-sm font-medium text-gray-700"
							>
								Rejection Reason (for all selected photos) *
							</label>
							<Textarea
								id="bulk-rejection-reason"
								value={rejectionReason}
								onChange={(e) => setRejectionReason(e.target.value)}
								placeholder="Please provide a reason that applies to all selected photos..."
								className="mt-1"
								rows={3}
							/>
						</div>

						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => {
									setIsRejectDialogOpen(false);
									setRejectionReason("");
								}}
							>
								Cancel
							</Button>
							<Button
								onClick={handleBulkReject}
								disabled={!rejectionReason.trim() || isLoading}
								className="bg-red-600 hover:bg-red-700"
							>
								{isLoading ? (
									<LoadingSpinner className="h-4 w-4 mr-2" />
								) : (
									<XCircle className="h-4 w-4 mr-2" />
								)}
								Reject {selectedPhotoIds.length} Photo
								{selectedPhotoIds.length !== 1 ? "s" : ""}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
