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
import { cn } from "~/lib/utils";
import type { PhotoWithRelations } from "../../../api/database/schema";

interface PhotoLightboxProps {
	photos: PhotoWithRelations[];
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
	const [showMetadata, setShowMetadata] = useState(false);
	const currentPhoto = photos[currentIndex];

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
				case "i":
				case "I":
					event.preventDefault();
					setShowMetadata((prev) => !prev);
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
		<div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
			{/* Top Controls */}
			<div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
				<div className="flex items-center space-x-4">
					<span className="text-white text-sm">
						{currentIndex + 1} of {photos.length}
					</span>
					<h2 className="text-white text-lg font-medium">
						{currentPhoto.title}
					</h2>
				</div>

				<div className="flex items-center space-x-2">
					<button
						type="button"
						onClick={() => setShowMetadata(!showMetadata)}
						className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
						title="Toggle info (I)"
					>
						<Info size={20} />
					</button>
					<button
						type="button"
						onClick={handleZoomOut}
						className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
						title="Zoom out (-)"
					>
						<ZoomOut size={20} />
					</button>
					<button
						type="button"
						onClick={handleZoomReset}
						className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
						title="Reset zoom (0)"
					>
						<RotateCcw size={20} />
					</button>
					<button
						type="button"
						onClick={handleZoomIn}
						className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
						title="Zoom in (+)"
					>
						<ZoomIn size={20} />
					</button>
					<button
						type="button"
						onClick={onClose}
						className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
						title="Close (Esc)"
					>
						<X size={24} />
					</button>
				</div>
			</div>

			{/* Navigation Arrows */}
			{photos.length > 1 && (
				<>
					<button
						type="button"
						onClick={handlePrevious}
						className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors z-10"
						title="Previous (←)"
					>
						<ChevronLeft size={32} />
					</button>
					<button
						type="button"
						onClick={handleNext}
						className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors z-10"
						title="Next (→)"
					>
						<ChevronRight size={32} />
					</button>
				</>
			)}

			{/* Main Image */}
			<div
				className="relative max-w-full max-h-full overflow-hidden cursor-grab active:cursor-grabbing"
				onClick={(e) => {
					if (e.target === e.currentTarget) {
						onClose();
					}
				}}
				onKeyDown={(e) => {
					if (
						(e.key === "Enter" || e.key === " ") &&
						e.target === e.currentTarget
					) {
						onClose();
					}
				}}
			>
				<img
					src={`/api/photos/serve/${encodeURIComponent(currentPhoto.filePath)}`}
					alt={currentPhoto.title}
					className="max-w-full max-h-full object-contain transition-transform duration-200"
					style={{ transform: `scale(${zoom})` }}
					draggable={false}
				/>
			</div>

			{/* Metadata Panel */}
			{showMetadata && (
				<div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-80 text-white p-6 rounded-lg backdrop-blur-sm max-w-md ml-auto">
					<h3 className="text-xl font-semibold mb-3">{currentPhoto.title}</h3>

					{currentPhoto.description && (
						<p className="text-gray-300 mb-4">{currentPhoto.description}</p>
					)}

					<div className="space-y-2 text-sm">
						{currentPhoto.user && (
							<div className="flex items-center">
								<span className="text-gray-400 w-20">Photographer:</span>
								<span>{currentPhoto.user.name}</span>
							</div>
						)}

						{currentPhoto.category && (
							<div className="flex items-center">
								<span className="text-gray-400 w-20">Category:</span>
								<span>{currentPhoto.category.name}</span>
							</div>
						)}

						{currentPhoto.location && (
							<div className="flex items-center">
								<span className="text-gray-400 w-20">Location:</span>
								<span>{currentPhoto.location}</span>
							</div>
						)}

						{currentPhoto.dateTaken && (
							<div className="flex items-center">
								<span className="text-gray-400 w-20">Captured:</span>
								<span>
									{new Date(currentPhoto.dateTaken).toLocaleDateString()}
								</span>
							</div>
						)}

						<div className="flex items-center">
							<span className="text-gray-400 w-20">Submitted:</span>
							<span>
								{new Date(currentPhoto.createdAt).toLocaleDateString()}
							</span>
						</div>
					</div>

					<div className="mt-4 pt-4 border-t border-gray-600 text-xs text-gray-400">
						<p>Use arrow keys to navigate • I to toggle info • ESC to close</p>
						<p>+/- to zoom • 0 to reset zoom</p>
					</div>
				</div>
			)}

			{/* Click overlay to close */}
			<div
				className="absolute inset-0 -z-10"
				onClick={onClose}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						onClose();
					}
				}}
				tabIndex={0}
				role="button"
				aria-label="Close lightbox"
			/>
		</div>
	);
}
