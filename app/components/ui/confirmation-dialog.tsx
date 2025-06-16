import { AlertTriangle } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { cn } from "~/lib/utils";

interface ConfirmationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	confirmText?: string;
	cancelText?: string;
	variant?: "default" | "destructive";
	onConfirm: () => void;
	loading?: boolean;
}

export function ConfirmationDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmText = "Confirm",
	cancelText = "Cancel",
	variant = "default",
	onConfirm,
	loading = false,
}: ConfirmationDialogProps) {
	const handleConfirm = () => {
		onConfirm();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-3">
						{variant === "destructive" && (
							<div className="flex-shrink-0">
								<AlertTriangle className="h-6 w-6 text-red-600" />
							</div>
						)}
						<div>
							<DialogTitle className={cn(
								variant === "destructive" && "text-red-900"
							)}>
								{title}
							</DialogTitle>
						</div>
					</div>
					<DialogDescription className="pt-2">
						{description}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="gap-2 sm:gap-2">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={loading}
					>
						{cancelText}
					</Button>
					<Button
						variant={variant === "destructive" ? "destructive" : "default"}
						onClick={handleConfirm}
						disabled={loading}
						className="min-w-20"
					>
						{loading ? (
							<LoadingSpinner className="h-4 w-4" />
						) : (
							confirmText
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}