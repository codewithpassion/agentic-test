import {
	ChevronLeft,
	ChevronRight,
	Info,
	RotateCcw,
	X,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "~/hooks/use-auth";
import { useUserVoteStats, useVoteForPhoto } from "~/hooks/use-votes";
import type { PhotoWithRelations } from "../../../api/database/schema";
import { VoteIndicator } from "../ui/vote-indicator";

// Extend PhotoWithRelations to include vote data
type PhotoWithVotes = PhotoWithRelations & {
	voteCount?: number;
	hasVoted?: boolean;
};

interface PhotoLightboxProps {
	photos: PhotoWithVotes[];
	currentIndex: number;
	isOpen: boolean;
	onClose: () => void;
	onNavigate?: (index: number) => void;
}

export function PhotoLightbox({
	photos,
	currentIndex,
	isOpen,
	onClose,
	onNavigate,
}: PhotoLightboxProps) {
	const [zoom, setZoom] = useState(1);
	const currentPhoto = photos[currentIndex];
	const navigate = useNavigate();
	const { user } = useAuth();

	// Get user's vote stats
	const { data: voteStats } = useUserVoteStats(
		currentPhoto?.competitionId || "",
	);

	// Voting functionality
	const {
		vote,
		unvote,
		isLoading: voteLoading,
	} = useVoteForPhoto(currentPhoto?.id || "", currentPhoto?.categoryId);

	const handleVote = () => {
		if (!currentPhoto) return;

		// Check if user is authenticated
		if (!user) {
			toast.info("Please login to vote");
			navigate("/login");
			return;
		}

		if (currentPhoto.hasVoted) {
			unvote();
		} else {
			// Check if user has votes remaining
			if (voteStats && voteStats.remainingVotes === 0) {
				toast.error(
					"You've used all 3 votes. Remove a vote to vote for another photo.",
				);
				return;
			}
			vote();
		}
	};

	useEffect(() => {
		console.log("Current photo:", currentPhoto);
	}, [currentPhoto]);

	const handlePrevious = useCallback(() => {
		const newIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
		onNavigate?.(newIndex);
		setZoom(1);
	}, [currentIndex, photos.length, onNavigate]);

	const handleNext = useCallback(() => {
		const newIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
		onNavigate?.(newIndex);
		setZoom(1);
	}, [currentIndex, photos.length, onNavigate]);

	const handleZoomIn = useCallback(() => {
		setZoom((prev) => Math.min(prev + 0.5, 3));
	}, []);

	const handleZoomOut = useCallback(() => {
		setZoom((prev) => Math.max(prev - 0.5, 0.5));
	}, []);

	const handleZoomReset = useCallback(() => {
		setZoom(1);
	}, []);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (!isOpen) return;

			switch (event.key) {
				case "Escape":
					onClose();
					break;
				case "ArrowLeft":
					event.preventDefault();
					handlePrevious();
					break;
				case "ArrowRight":
					event.preventDefault();
					handleNext();
					break;
				case "+":
				case "=":
					event.preventDefault();
					handleZoomIn();
					break;
				case "-":
					event.preventDefault();
					handleZoomOut();
					break;
				case "0":
					event.preventDefault();
					handleZoomReset();
					break;
			}
		},
		[
			isOpen,
			onClose,
			handlePrevious,
			handleNext,
			handleZoomIn,
			handleZoomOut,
			handleZoomReset,
		],
	);

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}

		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	if (!isOpen || !currentPhoto) return null;

	return (
		<div className="fixed inset-0 z-50 bg-white flex">
			{/* Left side - Image */}
			<div className="flex-1 relative bg-gray-100">
				{/* Top controls on image side */}
				<div className="absolute top-6 left-6 z-10">
					<button
						type="button"
						onClick={onClose}
						className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
						title="Close (Esc)"
					>
						<X size={20} />
					</button>
				</div>

				{/* Zoom controls */}
				<div className="absolute top-6 right-6 flex items-center space-x-2 z-10">
					<button
						type="button"
						onClick={handleZoomOut}
						className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
						title="Zoom out (-)"
					>
						<ZoomOut size={18} />
					</button>
					<button
						type="button"
						onClick={handleZoomReset}
						className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
						title="Reset zoom (0)"
					>
						<RotateCcw size={18} />
					</button>
					<button
						type="button"
						onClick={handleZoomIn}
						className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
						title="Zoom in (+)"
					>
						<ZoomIn size={18} />
					</button>
				</div>

				{/* Navigation Arrows */}
				{photos.length > 1 && (
					<>
						<button
							type="button"
							onClick={handlePrevious}
							className="absolute left-6 top-1/2 -translate-y-1/2 p-3 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors z-10"
							title="Previous (←)"
						>
							<ChevronLeft size={24} />
						</button>
						<button
							type="button"
							onClick={handleNext}
							className="absolute right-6 top-1/2 -translate-y-1/2 p-3 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors z-10"
							title="Next (→)"
						>
							<ChevronRight size={24} />
						</button>
					</>
				)}

				{/* Main Image Container */}
				<div className="h-full flex items-center justify-center p-8">
					<div className="relative w-full h-full flex items-center justify-center overflow-hidden">
						<img
							src={`/api/photos/serve/${encodeURIComponent(currentPhoto.filePath)}`}
							alt={currentPhoto.title}
							className="max-w-full max-h-full object-contain transition-transform duration-200 shadow-2xl"
							style={{
								transform: `scale(${zoom})`,
								maxWidth: zoom > 1 ? "none" : "100%",
								maxHeight: zoom > 1 ? "none" : "100%",
							}}
							draggable={false}
						/>

						{/* Vote Button - Bottom Center */}
						{currentPhoto.status === "approved" && (
							<div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
								<button
									type="button"
									onClick={handleVote}
									disabled={voteLoading}
									className={`
										flex items-center gap-3 px-6 py-3 rounded-full
										bg-white/95 backdrop-blur-sm shadow-lg
										transition-all duration-200 transform
										${
											currentPhoto.hasVoted
												? "text-red-600 hover:bg-red-50 hover:scale-105"
												: "text-gray-700 hover:bg-gray-50 hover:scale-105"
										}
										${voteLoading ? "opacity-50 cursor-not-allowed" : ""}
									`}
								>
									<svg
										className={`w-6 h-6 transition-all duration-200 ${
											currentPhoto.hasVoted ? "fill-current" : ""
										} ${voteLoading ? "animate-pulse" : ""}`}
										fill={currentPhoto.hasVoted ? "currentColor" : "none"}
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<title>
											{currentPhoto.hasVoted
												? "Remove vote"
												: "Vote for this photo"}
										</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
										/>
									</svg>
									<span className="font-medium text-lg">
										{currentPhoto.hasVoted ? "Voted" : "Vote"}
									</span>
									<span className="font-bold text-lg tabular-nums">
										{currentPhoto.voteCount || 0}
									</span>
								</button>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Right side - Metadata Panel */}
			<div className="w-80 bg-white border-l border-gray-200 flex flex-col">
				{/* Header */}
				<div className="p-6 border-b border-gray-200">
					<div className="mb-2 flex items-center justify-between">
						<span className="text-sm text-gray-500">
							{currentIndex + 1} of {photos.length}
						</span>
						{user && voteStats && (
							<VoteIndicator
								totalVotes={voteStats.totalVotes}
								maxVotes={voteStats.maxVotes}
								size="sm"
							/>
						)}
					</div>
					<h2 className="text-xl font-semibold text-gray-900 leading-tight">
						{currentPhoto.title}
					</h2>
					{currentPhoto.description && (
						<p className="text-sm text-gray-600 mt-2 leading-relaxed">
							{currentPhoto.description}
						</p>
					)}
				</div>

				{/* Metadata Details */}
				<div className="flex-1 p-6 space-y-4 overflow-y-auto">
					{currentPhoto.user && (
						<div>
							<dt className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
								Photographer
							</dt>
							<dd className="text-sm text-gray-900">
								{currentPhoto.user.name}
							</dd>
						</div>
					)}

					{currentPhoto.category && (
						<div>
							<dt className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
								Category
							</dt>
							<dd className="text-sm text-gray-900">
								{currentPhoto.category.name}
							</dd>
						</div>
					)}

					{currentPhoto.location && (
						<div>
							<dt className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
								Location
							</dt>
							<dd className="text-sm text-gray-900">{currentPhoto.location}</dd>
						</div>
					)}

					{currentPhoto.dateTaken && (
						<div>
							<dt className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
								Date Captured
							</dt>
							<dd className="text-sm text-gray-900">
								{new Date(currentPhoto.dateTaken).toLocaleDateString("en-US", {
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</dd>
						</div>
					)}

					<div>
						<dt className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
							Date Submitted
						</dt>
						<dd className="text-sm text-gray-900">
							{new Date(currentPhoto.createdAt).toLocaleDateString("en-US", {
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</dd>
					</div>

					{currentPhoto.competition && (
						<div>
							<dt className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
								Competition
							</dt>
							<dd className="text-sm text-gray-900">
								{currentPhoto.competition.title}
							</dd>
						</div>
					)}
				</div>

				{/* Footer with keyboard shortcuts */}
				<div className="p-4 border-t border-gray-200 bg-gray-50">
					<div className="text-xs text-gray-500 space-y-1">
						<p>← → Navigate • Esc Close</p>
						<p>+ - Zoom • 0 Reset</p>
					</div>
				</div>
			</div>
		</div>
	);
}
