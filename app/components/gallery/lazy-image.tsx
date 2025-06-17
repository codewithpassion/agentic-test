import { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";

interface LazyImageProps {
	src: string;
	alt: string;
	className?: string;
	aspectRatio?: "square" | "portrait" | "landscape" | "auto";
	objectFit?: "cover" | "contain" | "fill";
	placeholder?: string;
	onLoad?: () => void;
	onError?: () => void;
	onClick?: () => void;
}

export function LazyImage({
	src,
	alt,
	className,
	aspectRatio = "auto",
	objectFit = "cover",
	placeholder = "https://placehold.co/400x300/e5e7eb/9ca3af?text=Loading...",
	onLoad,
	onError,
	onClick,
}: LazyImageProps) {
	const [isLoaded, setIsLoaded] = useState(false);
	const [isError, setIsError] = useState(false);
	const [isInView, setIsInView] = useState(false);
	const imgRef = useRef<HTMLImageElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsInView(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.1 },
		);

		if (imgRef.current) {
			observer.observe(imgRef.current);
		}

		return () => observer.disconnect();
	}, []);

	const handleLoad = () => {
		setIsLoaded(true);
		onLoad?.();
	};

	const handleError = () => {
		setIsError(true);
		onError?.();
	};

	const aspectRatioClasses = {
		square: "aspect-square",
		portrait: "aspect-[3/4]",
		landscape: "aspect-[4/3]",
		auto: "",
	};

	const objectFitClasses = {
		cover: "object-cover",
		contain: "object-contain",
		fill: "object-fill",
	};

	return (
		<div
			ref={imgRef}
			className={cn(
				"relative overflow-hidden bg-gray-100",
				aspectRatioClasses[aspectRatio],
				onClick && "cursor-pointer",
				className,
			)}
			onClick={onClick}
			onKeyUp={onClick}
			tabIndex={onClick ? 0 : undefined}
			role={onClick ? "button" : undefined}
		>
			{!isInView && (
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
				</div>
			)}

			{isInView && (
				<>
					{!isLoaded && !isError && (
						<img
							src={placeholder}
							alt="Loading..."
							className={cn("w-full h-full", objectFitClasses[objectFit])}
						/>
					)}

					<img
						src={src}
						alt={alt}
						className={cn(
							"w-full h-full transition-opacity duration-300",
							objectFitClasses[objectFit],
							isLoaded ? "opacity-100" : "opacity-0",
						)}
						onLoad={handleLoad}
						onError={handleError}
					/>

					{isError && (
						<div className="absolute inset-0 flex items-center justify-center bg-gray-100">
							<div className="text-center text-gray-500">
								<div className="text-2xl mb-2">📷</div>
								<div className="text-sm">Failed to load image</div>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}
