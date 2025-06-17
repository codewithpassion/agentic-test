import { Clock, Filter, Search } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { trpc } from "~/lib/trpc";

export default function PendingModerationPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [limit] = useState(20);
	const [offset, setOffset] = useState(0);

	const {
		data: moderationData,
		isLoading,
		error,
	} = trpc.photos.getForModeration.useQuery({
		limit,
		offset,
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
				<div>
					<h1 className="text-2xl font-bold">Pending Photos</h1>
					<p className="text-gray-600">Review photos waiting for moderation</p>
				</div>
				<Card>
					<CardContent className="p-6">
						<div className="text-center text-red-600">
							<p>Error loading pending photos: {error.message}</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Filter for pending photos only and apply search
	const pendingPhotos =
		moderationData?.photos?.filter((photo) => {
			const matchesPending = photo.status === "pending";
			const matchesSearch =
				searchQuery === "" ||
				photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				photo.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				photo.competition?.title
					?.toLowerCase()
					.includes(searchQuery.toLowerCase());

			return matchesPending && matchesSearch;
		}) || [];

	const pendingCount = pendingPhotos.length;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Pending Photos</h1>
				<p className="text-gray-600">
					{pendingCount} photo{pendingCount !== 1 ? "s" : ""} waiting for your
					review
				</p>
			</div>

			{/* Search and Filters */}
			<Card>
				<CardContent className="p-6">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
								<Input
									type="text"
									placeholder="Search by title, user, or competition..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>
						<div className="flex items-center gap-2 text-sm text-gray-600">
							<Filter className="h-4 w-4" />
							<span>Showing: Pending only</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Results */}
			{pendingCount === 0 ? (
				<Card>
					<CardContent className="p-12">
						<div className="text-center text-gray-500">
							<Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
							<h3 className="text-lg font-medium mb-2">No pending photos</h3>
							<p>
								{searchQuery
									? "No pending photos match your search criteria"
									: "All photos have been reviewed"}
							</p>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{pendingPhotos.map((photo) => (
						<Card key={photo.id} className="overflow-hidden">
							<div className="aspect-video bg-gray-200 flex items-center justify-center">
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
							</div>
							<CardHeader className="pb-2">
								<CardTitle className="text-lg truncate">
									{photo.title}
								</CardTitle>
								<div className="space-y-1 text-sm text-gray-600">
									<p>By: {photo.user?.name || "Unknown user"}</p>
									<p>Competition: {photo.competition?.title}</p>
									<p>Category: {photo.category?.name}</p>
									<p className="text-xs text-gray-400">
										Submitted: {new Date(photo.createdAt).toLocaleDateString()}
									</p>
								</div>
							</CardHeader>
							<CardContent className="pt-0">
								<div className="flex items-center justify-between">
									<div className="flex items-center text-amber-600">
										<Clock className="h-4 w-4 mr-1" />
										<span className="text-sm font-medium">Pending</span>
									</div>
									<button
										type="button"
										onClick={() => {
											// Navigate to individual photo review
											window.location.href = `/admin/moderation/${photo.id}`;
										}}
										className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
									>
										Review
									</button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Load More - Simple implementation */}
			{pendingCount >= limit && (
				<div className="text-center">
					<button
						type="button"
						onClick={() => setOffset(offset + limit)}
						className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
					>
						Load More
					</button>
				</div>
			)}
		</div>
	);
}

export function meta() {
	return [
		{ title: "Pending Photos - Photo Moderation" },
		{ name: "description", content: "Review pending photo submissions" },
	];
}
