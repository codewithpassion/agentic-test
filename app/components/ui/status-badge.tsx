import { Check, Clock, Pause, Trophy } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

interface StatusBadgeProps {
	status: "active" | "draft" | "completed" | "inactive";
	size?: "sm" | "md" | "lg";
	showIcon?: boolean;
	className?: string;
}

export function StatusBadge({ 
	status, 
	size = "md", 
	showIcon = false, 
	className 
}: StatusBadgeProps) {
	const getStatusConfig = () => {
		switch (status) {
			case "active":
				return {
					label: "Active",
					className: "bg-green-100 text-green-800 border-green-200",
					icon: Check,
				};
			case "draft":
				return {
					label: "Draft",
					className: "bg-gray-100 text-gray-800 border-gray-200",
					icon: Clock,
				};
			case "completed":
				return {
					label: "Completed",
					className: "bg-blue-100 text-blue-800 border-blue-200",
					icon: Trophy,
				};
			case "inactive":
				return {
					label: "Inactive",
					className: "bg-orange-100 text-orange-800 border-orange-200",
					icon: Pause,
				};
			default:
				return {
					label: status,
					className: "bg-gray-100 text-gray-800 border-gray-200",
					icon: Clock,
				};
		}
	};

	const config = getStatusConfig();
	const Icon = config.icon;

	const sizeClasses = {
		sm: "text-xs px-1.5 py-0.5",
		md: "text-sm px-2 py-1",
		lg: "text-base px-3 py-1.5",
	};

	const iconSizes = {
		sm: "h-3 w-3",
		md: "h-4 w-4",
		lg: "h-5 w-5",
	};

	return (
		<Badge
			className={cn(
				config.className,
				sizeClasses[size],
				showIcon && "flex items-center gap-1",
				className
			)}
		>
			{showIcon && <Icon className={iconSizes[size]} />}
			{config.label}
		</Badge>
	);
}