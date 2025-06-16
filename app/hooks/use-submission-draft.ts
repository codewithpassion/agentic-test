/**
 * Hook for managing photo submission drafts with localStorage
 */

import { useCallback, useEffect, useState } from "react";
import type { PhotoMetadata } from "~/components/photo/metadata-form";

interface DraftData {
	metadata: Partial<PhotoMetadata>;
	timestamp: number;
	competitionId: string;
	categoryId: string;
}

interface UseSubmissionDraftProps {
	competitionId: string;
	categoryId: string;
}

export function useSubmissionDraft({
	competitionId,
	categoryId,
}: UseSubmissionDraftProps) {
	const [draftData, setDraftData] = useState<Partial<PhotoMetadata> | null>(
		null,
	);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);

	// Generate storage key
	const getDraftKey = useCallback(() => {
		return `photo-draft-${competitionId}-${categoryId}`;
	}, [competitionId, categoryId]);

	// Load draft from localStorage on mount
	useEffect(() => {
		const loadDraft = () => {
			try {
				const draftKey = getDraftKey();
				const stored = localStorage.getItem(draftKey);

				if (stored) {
					const draft: DraftData = JSON.parse(stored);

					// Check if draft is for the current competition/category
					if (
						draft.competitionId === competitionId &&
						draft.categoryId === categoryId
					) {
						setDraftData(draft.metadata);
						setLastSaved(new Date(draft.timestamp));
					}
				}
			} catch (error) {
				console.warn("Failed to load draft from localStorage:", error);
			}
		};

		loadDraft();
	}, [competitionId, categoryId, getDraftKey]);

	// Save draft to localStorage
	const saveDraft = useCallback(
		(metadata: Partial<PhotoMetadata>) => {
			try {
				const draftKey = getDraftKey();
				const now = Date.now();

				const draftData: DraftData = {
					metadata,
					timestamp: now,
					competitionId,
					categoryId,
				};

				localStorage.setItem(draftKey, JSON.stringify(draftData));
				setDraftData(metadata);
				setLastSaved(new Date(now));
			} catch (error) {
				console.warn("Failed to save draft to localStorage:", error);
			}
		},
		[competitionId, categoryId, getDraftKey],
	);

	// Clear draft from localStorage
	const clearDraft = useCallback(() => {
		try {
			const draftKey = getDraftKey();
			localStorage.removeItem(draftKey);
			setDraftData(null);
			setLastSaved(null);
		} catch (error) {
			console.warn("Failed to clear draft from localStorage:", error);
		}
	}, [getDraftKey]);

	// Check if there's a draft available
	const hasDraft = Boolean(draftData && Object.keys(draftData).length > 0);

	// Get draft age in minutes
	const getDraftAge = useCallback(() => {
		if (!lastSaved) return null;

		const now = Date.now();
		const ageMs = now - lastSaved.getTime();
		return Math.floor(ageMs / (1000 * 60)); // Convert to minutes
	}, [lastSaved]);

	// Check if draft is recent (less than 24 hours old)
	const isDraftRecent = useCallback(() => {
		const age = getDraftAge();
		return age !== null && age < 24 * 60; // 24 hours in minutes
	}, [getDraftAge]);

	// Get all drafts for cleanup (optional utility)
	const getAllDrafts = useCallback(() => {
		const drafts: Array<{ key: string; data: DraftData }> = [];

		try {
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key?.startsWith("photo-draft-")) {
					const stored = localStorage.getItem(key);
					if (stored) {
						const data: DraftData = JSON.parse(stored);
						drafts.push({ key, data });
					}
				}
			}
		} catch (error) {
			console.warn("Failed to get all drafts:", error);
		}

		return drafts;
	}, []);

	// Clean up old drafts (older than 7 days)
	const cleanupOldDrafts = useCallback(() => {
		const drafts = getAllDrafts();
		const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

		for (const { key, data } of drafts) {
			if (data.timestamp < oneWeekAgo) {
				try {
					localStorage.removeItem(key);
				} catch (error) {
					console.warn(`Failed to remove old draft ${key}:`, error);
				}
			}
		}
	}, [getAllDrafts]);

	// Auto-cleanup on mount
	useEffect(() => {
		cleanupOldDrafts();
	}, [cleanupOldDrafts]);

	return {
		// Draft data
		draftData,
		hasDraft,
		lastSaved,

		// Actions
		saveDraft,
		clearDraft,

		// Utilities
		getDraftAge,
		isDraftRecent,
		cleanupOldDrafts,
	};
}

/**
 * Hook for managing multiple drafts across different competitions/categories
 */
export function useAllSubmissionDrafts() {
	const [drafts, setDrafts] = useState<Array<{ key: string; data: DraftData }>>(
		[],
	);

	// Load all drafts
	const loadAllDrafts = useCallback(() => {
		const allDrafts: Array<{ key: string; data: DraftData }> = [];

		try {
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key?.startsWith("photo-draft-")) {
					const stored = localStorage.getItem(key);
					if (stored) {
						const data: DraftData = JSON.parse(stored);
						allDrafts.push({ key, data });
					}
				}
			}
		} catch (error) {
			console.warn("Failed to load all drafts:", error);
		}

		setDrafts(allDrafts);
	}, []);

	// Delete specific draft
	const deleteDraft = useCallback((key: string) => {
		try {
			localStorage.removeItem(key);
			setDrafts((prev) => prev.filter((draft) => draft.key !== key));
		} catch (error) {
			console.warn(`Failed to delete draft ${key}:`, error);
		}
	}, []);

	// Clear all drafts
	const clearAllDrafts = useCallback(() => {
		for (const { key } of drafts) {
			try {
				localStorage.removeItem(key);
			} catch (error) {
				console.warn(`Failed to remove draft ${key}:`, error);
			}
		}
		setDrafts([]);
	}, [drafts]);

	// Load drafts on mount
	useEffect(() => {
		loadAllDrafts();
	}, [loadAllDrafts]);

	return {
		drafts,
		loadAllDrafts,
		deleteDraft,
		clearAllDrafts,
		draftCount: drafts.length,
	};
}

/**
 * Utility function to parse competition and category IDs from draft key
 */
export function parseDraftKey(
	draftKey: string,
): { competitionId: string; categoryId: string } | null {
	const match = draftKey.match(/^photo-draft-(.+)-(.+)$/);
	if (match) {
		return {
			competitionId: match[1],
			categoryId: match[2],
		};
	}
	return null;
}

/**
 * Utility function to format draft age for display
 */
export function formatDraftAge(timestamp: number): string {
	const now = Date.now();
	const ageMs = now - timestamp;
	const ageMinutes = Math.floor(ageMs / (1000 * 60));
	const ageHours = Math.floor(ageMinutes / 60);
	const ageDays = Math.floor(ageHours / 24);

	if (ageDays > 0) {
		return `${ageDays} day${ageDays > 1 ? "s" : ""} ago`;
	}
	if (ageHours > 0) {
		return `${ageHours} hour${ageHours > 1 ? "s" : ""} ago`;
	}
	if (ageMinutes > 0) {
		return `${ageMinutes} minute${ageMinutes > 1 ? "s" : ""} ago`;
	}
	return "Just now";
}
