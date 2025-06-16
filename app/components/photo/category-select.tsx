/**
 * Category selection dropdown component
 */

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";
import type { Category } from "../../../api/database/schema";

export interface CategoryWithSubmissionInfo extends Category {
	userSubmissionCount: number;
	remainingSlots: number;
	canSubmit: boolean;
}

export interface CategorySelectProps {
	categories: CategoryWithSubmissionInfo[];
	selectedCategoryId?: string;
	onCategoryChange: (categoryId: string) => void;
	disabled?: boolean;
	className?: string;
	placeholder?: string;
}

export function CategorySelect({
	categories,
	selectedCategoryId,
	onCategoryChange,
	disabled = false,
	className,
	placeholder = "Select a category",
}: CategorySelectProps) {
	const [isOpen, setIsOpen] = useState(false);

	const selectedCategory = categories.find(
		(cat) => cat.id === selectedCategoryId,
	);

	const availableCategories = categories.filter((cat) => cat.canSubmit);

	const handleCategorySelect = (categoryId: string) => {
		onCategoryChange(categoryId);
		setIsOpen(false);
	};

	return (
		<div className={cn("relative", className)}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				disabled={disabled || availableCategories.length === 0}
				className={cn(
					"w-full px-3 py-2 text-left border rounded-lg flex items-center justify-between",
					"focus:ring-2 focus:ring-primary/20 focus:border-primary",
					"disabled:opacity-50 disabled:cursor-not-allowed",
					selectedCategory ? "text-gray-900" : "text-gray-500",
					isOpen ? "border-primary" : "border-gray-300",
				)}
			>
				<span className="truncate">
					{selectedCategory ? selectedCategory.name : placeholder}
				</span>
				<ChevronDown
					className={cn(
						"h-4 w-4 text-gray-400 transition-transform",
						isOpen && "rotate-180",
					)}
				/>
			</button>

			{isOpen && (
				<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
					{availableCategories.length === 0 ? (
						<div className="px-3 py-2 text-sm text-gray-500">
							No categories available
						</div>
					) : (
						availableCategories.map((category) => (
							<button
								key={category.id}
								type="button"
								onClick={() => handleCategorySelect(category.id)}
								className={cn(
									"w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between",
									selectedCategoryId === category.id &&
										"bg-primary/10 text-primary",
								)}
							>
								<div className="flex-1 min-w-0">
									<div className="font-medium truncate">{category.name}</div>
									<div className="text-xs text-gray-500">
										{category.remainingSlots} slot
										{category.remainingSlots !== 1 ? "s" : ""} remaining
									</div>
								</div>
								<div className="text-xs text-gray-400 ml-2">
									{category.userSubmissionCount}/{category.maxPhotosPerUser}
								</div>
							</button>
						))
					)}
				</div>
			)}

			{/* Selected category info */}
			{selectedCategory && (
				<div className="mt-1 text-xs text-gray-500">
					{selectedCategory.remainingSlots} submission
					{selectedCategory.remainingSlots !== 1 ? "s" : ""} remaining in this
					category
				</div>
			)}

			{/* Click outside handler */}
			{isOpen && (
				<div
					className="fixed inset-0 z-0"
					onClick={() => setIsOpen(false)}
					onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
				/>
			)}
		</div>
	);
}
