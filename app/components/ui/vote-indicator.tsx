import { Heart } from "lucide-react";
import { cn } from "~/lib/utils";

interface VoteIndicatorProps {
	totalVotes: number;
	maxVotes: number;
	className?: string;
	size?: "sm" | "md" | "lg";
}

export function VoteIndicator({
	totalVotes,
	maxVotes,
	className,
	size = "md",
}: VoteIndicatorProps) {
	const remainingVotes = maxVotes - totalVotes;

	const sizeClasses = {
		sm: "text-sm gap-1",
		md: "text-base gap-1.5",
		lg: "text-lg gap-2",
	};

	const heartSizes = {
		sm: "h-4 w-4",
		md: "h-5 w-5",
		lg: "h-6 w-6",
	};

	return (
		<div
			className={cn(
				"flex items-center",
				sizeClasses[size],
				className,
			)}
		>
			<span className="text-gray-700 font-medium">Votes:</span>
			<div className="flex items-center gap-0.5">
				{Array.from({ length: maxVotes }).map((_, index) => (
					<Heart
						key={index}
						className={cn(
							heartSizes[size],
							"transition-all duration-200",
							index < totalVotes
								? "fill-red-500 text-red-500"
								: "text-gray-300",
						)}
					/>
				))}
			</div>
			<span className="text-gray-600">
				{totalVotes}/{maxVotes}
			</span>
			{remainingVotes === 0 && (
				<span className="text-xs text-gray-500 ml-2">
					(Remove a vote to vote again)
				</span>
			)}
		</div>
	);
}