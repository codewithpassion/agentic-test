import {
	CheckCircle,
	Clock,
	Filter,
	RotateCcw,
	Search,
	XCircle,
} from "lucide-react";
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
import { Input } from "~/components/ui/input";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { trpc } from "~/lib/trpc";

type PhotoStatus = "all" | "pending" | "approved" | "rejected";

export default function AllPhotosModerationPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<PhotoStatus>("all");
	const [competitionFilter, setCompetitionFilter] = useState<string>("all");
	const [limit] = useState(24);
	const [offset, setOffset] = useState(0);
	const [rejectionReason, setRejectionReason] = useState("");
	const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
	const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

	const {
		data: moderationData,
		isLoading,
		error,
		refetch,
	} = trpc.photos.getAllForAdmin.useQuery({
		limit: 100, // Maximum allowed by endpoint
		offset: 0,
		status: "all",
	});

	// Get competitions for filter dropdown
	const { data: competitions } = trpc.competitions.list.useQuery({
		limit: 100,
		offset: 0,
	});

	const moderatePhotoMutation = trpc.photos.moderate.useMutation({
		onSuccess: () => {
			setIsRejectDialogOpen(false);
			setSelectedPhotoId(null);
			setRejectionReason("");
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

	const handleReset = async (photoId: string) => {
		try {
			await moderatePhotoMutation.mutateAsync({
				photoId,
				action: "reset",
			});
		} catch (error) {
			console.error("Error resetting photo:", error);
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
					<h1 className="text-2xl font-bold">All Photos</h1>
					<p className="text-gray-600">
						Browse and moderate all photo submissions
					</p>
				</div>
				<Card>
					<CardContent className="p-6">
						<div className="text-center text-red-600">
							<p>Error loading photos: {error.message}</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Filter photos based on search, status, and competition
	const filteredPhotos =
		moderationData?.photos?.filter((photo) => {
			const matchesStatus =
				statusFilter === "all" || photo.status === statusFilter;
			const matchesCompetition =
				competitionFilter === "all" ||
				photo.competitionId === competitionFilter;
			const matchesSearch =
				searchQuery === "" ||
				photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				photo.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				photo.competition?.title
					?.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				photo.category?.name?.toLowerCase().includes(searchQuery.toLowerCase());

			return matchesStatus && matchesCompetition && matchesSearch;
		}) || [];

	// Apply pagination
	const paginatedPhotos = filteredPhotos.slice(offset, offset + limit);
	const hasMore = filteredPhotos.length > offset + limit;

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "pending":
				return <Clock className="h-4 w-4 text-amber-600" />;
			case "approved":
				return <CheckCircle className="h-4 w-4 text-green-600" />;
			case "rejected":
				return <XCircle className="h-4 w-4 text-red-600" />;
			default:
				return null;
		}
	};

	const getStatusBadge = (
		status: "pending" | "approved" | "rejected" | "deleted",
	) => {
		const variants = {
			pending: "bg-amber-100 text-amber-800",
			approved: "bg-green-100 text-green-800",
			rejected: "bg-red-100 text-red-800",
			deleted: "bg-gray-100 text-gray-800",
		};

		return (
			<Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
				{status.charAt(0).toUpperCase() + status.slice(1)}
			</Badge>
		);
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">All Photos</h1>
				<p className="text-gray-600">
					Browse and moderate all photo submissions ({filteredPhotos.length}{" "}
					total)
				</p>
			</div>

			{/* Search and Filters */}
			<Card>
				<CardContent className="p-6">
					<div className="space-y-4">
						{/* Search */}
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
							<Input
								type="text"
								placeholder="Search by title, user, competition, or category..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>

						{/* Filters */}
						<div className="flex flex-col sm:flex-row gap-4">
							{/* Status Filter */}
							<div className="flex items-center gap-4">
								<div className="flex items-center gap-2">
									<Filter className="h-4 w-4 text-gray-400" />
									<span className="text-sm font-medium text-gray-700">
										Status:
									</span>
								</div>
								<div className="flex gap-2">
									{[
										{ value: "all", label: "All" },
										{ value: "pending", label: "Pending" },
										{ value: "approved", label: "Approved" },
										{ value: "rejected", label: "Rejected" },
									].map((option) => (
										<Button
											key={option.value}
											variant={
												statusFilter === option.value ? "default" : "outline"
											}
											size="sm"
											onClick={() => {
												setStatusFilter(option.value as PhotoStatus);
												setOffset(0); // Reset pagination
											}}
										>
											{option.label}
										</Button>
									))}
								</div>
							</div>

							{/* Competition Filter */}
							<div className="flex items-center gap-4">
								<span className="text-sm font-medium text-gray-700">
									Competition:
								</span>
								<Select
									value={competitionFilter}
									onValueChange={(value) => {
										setCompetitionFilter(value);
										setOffset(0); // Reset pagination
									}}
								>
									<SelectTrigger className="w-48">
										<SelectValue placeholder="All competitions" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All competitions</SelectItem>
										{competitions?.map((competition) => (
											<SelectItem key={competition.id} value={competition.id}>
												{competition.title}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Results */}
			{filteredPhotos.length === 0 ? (
				<Card>
					<CardContent className="p-12">
						<div className="text-center text-gray-500">
							<div className="h-12 w-12 mx-auto mb-4 text-gray-300">
								<svg fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
									<title>No photos found</title>
									<path
										fillRule="evenodd"
										d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
										clipRule="evenodd"
									/>
								</svg>
							</div>
							<h3 className="text-lg font-medium mb-2">No photos found</h3>
							<p>
								{searchQuery ||
								statusFilter !== "all" ||
								competitionFilter !== "all"
									? "No photos match your current filters"
									: "No photos have been submitted yet"}
							</p>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{paginatedPhotos.map((photo) => (
						<Card key={photo.id} className="overflow-hidden">
							<div className="aspect-video bg-gray-200 flex items-center justify-center relative">
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
								<div
									className={`text-gray-400 ${photo.filePath ? "hidden" : ""}`}
								>
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
								<div className="absolute top-2 right-2">
									{getStatusBadge(photo.status)}
								</div>
							</div>

							<CardHeader className="pb-2">
								<CardTitle className="text-sm truncate">
									{photo.title}
								</CardTitle>
								<div className="space-y-1 text-xs text-gray-600">
									<p>By: {photo.user?.name || "Unknown user"}</p>
									<p>
										Competition:{" "}
										{photo.competition?.title || "Unknown competition"}
									</p>
									<p>Category: {photo.category?.name || "Unknown category"}</p>
									<p className="text-gray-400">
										Submitted: {new Date(photo.createdAt).toLocaleDateString()}
									</p>
									{photo.moderatedAt && (
										<p className="text-gray-400">
											Moderated:{" "}
											{new Date(photo.moderatedAt).toLocaleDateString()}
										</p>
									)}
								</div>
							</CardHeader>

							<CardContent className="pt-0">
								<div className="flex items-center justify-between mb-2">
									<div className="flex items-center">
										{getStatusIcon(photo.status)}
										<span className="text-xs font-medium ml-1 capitalize">
											{photo.status}
										</span>
									</div>
									<button
										type="button"
										onClick={() => {
											window.location.href = `/admin/moderation/${photo.id}`;
										}}
										className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
									>
										Details
									</button>
								</div>

								{/* Moderation Actions */}
								{photo.status === "pending" && (
									<div className="flex gap-1">
										<Button
											size="sm"
											variant="outline"
											className="flex-1 border-green-300 text-green-700 hover:bg-green-50 text-xs h-7"
											onClick={() => handleApprove(photo.id)}
											disabled={moderatePhotoMutation.isPending}
										>
											<CheckCircle className="h-3 w-3 mr-1" />
											Approve
										</Button>
										<Button
											size="sm"
											variant="outline"
											className="flex-1 border-red-300 text-red-700 hover:bg-red-50 text-xs h-7"
											onClick={() => openRejectDialog(photo.id)}
											disabled={moderatePhotoMutation.isPending}
										>
											<XCircle className="h-3 w-3 mr-1" />
											Reject
										</Button>
									</div>
								)}

								{photo.status === "approved" && (
									<div className="flex gap-1">
										<Button
											size="sm"
											variant="outline"
											className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50 text-xs h-7"
											onClick={() => handleReset(photo.id)}
											disabled={moderatePhotoMutation.isPending}
										>
											<RotateCcw className="h-3 w-3 mr-1" />
											Un-approve
										</Button>
										<Button
											size="sm"
											variant="outline"
											className="flex-1 border-red-300 text-red-700 hover:bg-red-50 text-xs h-7"
											onClick={() => openRejectDialog(photo.id)}
											disabled={moderatePhotoMutation.isPending}
										>
											<XCircle className="h-3 w-3 mr-1" />
											Reject
										</Button>
									</div>
								)}

								{photo.status === "rejected" && (
									<div className="flex gap-1">
										<Button
											size="sm"
											variant="outline"
											className="flex-1 border-green-300 text-green-700 hover:bg-green-50 text-xs h-7"
											onClick={() => handleApprove(photo.id)}
											disabled={moderatePhotoMutation.isPending}
										>
											<CheckCircle className="h-3 w-3 mr-1" />
											Approve
										</Button>
										<Button
											size="sm"
											variant="outline"
											className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50 text-xs h-7"
											onClick={() => handleReset(photo.id)}
											disabled={moderatePhotoMutation.isPending}
										>
											<RotateCcw className="h-3 w-3 mr-1" />
											Reset
										</Button>
									</div>
								)}

								{photo.rejectionReason && (
									<div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
										<p className="text-red-800 font-medium">
											Rejection reason:
										</p>
										<p className="text-red-700">{photo.rejectionReason}</p>
									</div>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Pagination */}
			{(hasMore || offset > 0) && (
				<div className="flex justify-center gap-4">
					{offset > 0 && (
						<Button
							variant="outline"
							onClick={() => setOffset(Math.max(0, offset - limit))}
						>
							Previous
						</Button>
					)}
					{hasMore && (
						<Button variant="outline" onClick={() => setOffset(offset + limit)}>
							Next
						</Button>
					)}
				</div>
			)}

			{/* Results summary */}
			<div className="text-center text-sm text-gray-600">
				Showing {Math.min(offset + 1, filteredPhotos.length)} -{" "}
				{Math.min(offset + limit, filteredPhotos.length)} of{" "}
				{filteredPhotos.length} photos
			</div>

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
								htmlFor="all-photos-rejection-reason"
								className="text-sm font-medium text-gray-700"
							>
								Rejection Reason *
							</label>
							<Textarea
								id="all-photos-rejection-reason"
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
		{ title: "All Photos - Photo Moderation" },
		{
			name: "description",
			content: "Browse and moderate all photo submissions",
		},
	];
}
