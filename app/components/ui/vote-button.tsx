import { Heart } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "~/hooks/use-auth";
import { cn } from "~/lib/utils";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./tooltip";

interface VoteButtonProps {
	photoId: string;
	voteCount: number;
	hasVoted: boolean;
	onVote: () => void;
	loading?: boolean;
	className?: string;
	showCount?: boolean;
	size?: "sm" | "md" | "lg";
}

export function VoteButton({
	photoId,
	voteCount,
	hasVoted,
	onVote,
	loading = false,
	className,
	showCount = true,
	size = "md",
}: VoteButtonProps) {
	const { user } = useAuth();
	const navigate = useNavigate();

	const sizeClasses = {
		sm: "h-8 px-2 text-sm gap-1",
		md: "h-10 px-3 text-base gap-2",
		lg: "h-12 px-4 text-lg gap-2",
	};

	const iconSizes = {
		sm: "h-4 w-4",
		md: "h-5 w-5",
		lg: "h-6 w-6",
	};

	const handleClick = () => {
		if (!user) {
			navigate("/login");
			return;
		}
		onVote();
	};

	const tooltipContent = !user
		? "Sign in to vote"
		: hasVoted
			? "Remove your vote"
			: "Vote for this photo";

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						onClick={handleClick}
						disabled={loading}
						className={cn(
							"inline-flex items-center justify-center rounded-md border transition-all duration-200",
							sizeClasses[size],
							hasVoted
								? "border-red-500 bg-red-50 text-red-600 hover:bg-red-100"
								: "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400",
							loading && "opacity-50 cursor-not-allowed",
							className,
						)}
					>
						<Heart
							className={cn(
								iconSizes[size],
								"transition-all duration-200",
								hasVoted && "fill-current",
								loading && "animate-pulse",
							)}
						/>
						{showCount && (
							<span className="font-medium tabular-nums">{voteCount}</span>
						)}
					</button>
				</TooltipTrigger>
				<TooltipContent>
					<p>{tooltipContent}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}