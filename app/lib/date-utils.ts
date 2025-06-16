/**
 * Format a date for competition display
 */
export function formatCompetitionDate(date: Date | string | null): string {
	if (!date) return "Not set";

	return new Date(date).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

/**
 * Format a date with time for detailed display
 */
export function formatDateTime(date: Date | string | null): string {
	if (!date) return "Not set";

	return new Date(date).toLocaleString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Format a date for HTML date inputs (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date | string | null): string {
	if (!date) return "";

	return new Date(date).toISOString().split("T")[0];
}

/**
 * Check if a date is in the future
 */
export function isDateInFuture(date: Date | string): boolean {
	return new Date(date).getTime() > Date.now();
}

/**
 * Get the difference between two dates in days
 */
export function getDateDifference(
	startDate: Date | string,
	endDate: Date | string,
): number {
	const start = new Date(startDate).getTime();
	const end = new Date(endDate).getTime();
	return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

/**
 * Get days remaining until a date (positive = future, negative = past)
 */
export function getDaysRemaining(date: Date | string | null): number | null {
	if (!date) return null;

	const targetDate = new Date(date).getTime();
	const now = Date.now();
	return Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(days: number): string {
	if (days === 0) return "Today";
	if (days === 1) return "1 day";
	if (days === -1) return "1 day ago";
	if (days > 0) return `${days} days`;
	return `${Math.abs(days)} days ago`;
}

/**
 * Get a relative time description
 */
export function getRelativeTime(date: Date | string | null): string {
	if (!date) return "Unknown";

	const days = getDaysRemaining(date);
	if (days === null) return "Unknown";

	if (days > 7)
		return `in ${Math.ceil(days / 7)} week${Math.ceil(days / 7) > 1 ? "s" : ""}`;
	if (days > 0) return `in ${days} day${days > 1 ? "s" : ""}`;
	if (days === 0) return "today";
	if (days >= -7)
		return `${Math.abs(days)} day${Math.abs(days) > 1 ? "s" : ""} ago`;
	return `${Math.ceil(Math.abs(days) / 7)} week${Math.ceil(Math.abs(days) / 7) > 1 ? "s" : ""} ago`;
}
