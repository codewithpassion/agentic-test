import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trpc } from "~/lib/trpc";

/**
 * Hook to handle voting for a photo with optimistic updates
 */
export function useVoteForPhoto(photoId: string, categoryId?: string) {
	const queryClient = useQueryClient();
	const utils = trpc.useContext();

	const voteMutation = trpc.votes.vote.useMutation({
		onMutate: async () => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: [["photos", "getById"], { input: { id: photoId } }],
			});

			// Snapshot the previous value
			const previousPhoto = utils.photos.getById.getData({ id: photoId });

			// Optimistically update
			if (previousPhoto) {
				utils.photos.getById.setData(
					{ id: photoId },
					{
						...previousPhoto,
						voteCount: (previousPhoto.voteCount || 0) + 1,
						hasVoted: true,
					},
				);
			}

			return { previousPhoto };
		},
		onSuccess: (data) => {
			// Update with the actual vote count from the server
			const previousPhoto = utils.photos.getById.getData({ id: photoId });
			if (previousPhoto) {
				utils.photos.getById.setData(
					{ id: photoId },
					{
						...previousPhoto,
						voteCount: data.voteCount,
						hasVoted: true,
					},
				);
			}
			toast.success("Vote recorded!");
		},
		onError: (err, newVote, context) => {
			// Revert the optimistic update
			if (context?.previousPhoto) {
				utils.photos.getById.setData({ id: photoId }, context.previousPhoto);
			}
			console.error("Failed to vote:", err);

			// Show user-friendly error message
			if (err.message.includes("already voted")) {
				toast.error("You've already voted in this category");
			} else if (err.message.includes("NOT_FOUND")) {
				toast.error("Photo not found");
			} else if (err.message.includes("UNAUTHORIZED")) {
				toast.error("Please login to vote");
			} else {
				toast.error("Failed to vote. Please try again.");
			}
		},
		onSettled: () => {
			// Always refetch after error or success
			void utils.photos.getById.invalidate({ id: photoId });
			if (categoryId) {
				void utils.photos.getByCategory.invalidate({ categoryId });
			}
			void utils.votes.getUserVotes.invalidate();
			void utils.votes.getVoteCounts.invalidate();
		},
	});

	const unvoteMutation = trpc.votes.unvote.useMutation({
		onMutate: async () => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: [["photos", "getById"], { input: { id: photoId } }],
			});

			// Snapshot the previous value
			const previousPhoto = utils.photos.getById.getData({ id: photoId });

			// Optimistically update
			if (previousPhoto) {
				utils.photos.getById.setData(
					{ id: photoId },
					{
						...previousPhoto,
						voteCount: Math.max(0, (previousPhoto.voteCount || 0) - 1),
						hasVoted: false,
					},
				);
			}

			return { previousPhoto };
		},
		onSuccess: (data) => {
			// Update with the actual vote count from the server
			const previousPhoto = utils.photos.getById.getData({ id: photoId });
			if (previousPhoto) {
				utils.photos.getById.setData(
					{ id: photoId },
					{
						...previousPhoto,
						voteCount: data.voteCount,
						hasVoted: false,
					},
				);
			}
			toast.success("Vote removed!");
		},
		onError: (err, newVote, context) => {
			// Revert the optimistic update
			if (context?.previousPhoto) {
				utils.photos.getById.setData({ id: photoId }, context.previousPhoto);
			}
			console.error("Failed to remove vote:", err);

			// Show user-friendly error message
			if (err.message.includes("NOT_FOUND")) {
				toast.error("Vote not found");
			} else if (err.message.includes("UNAUTHORIZED")) {
				toast.error("Please login to remove your vote");
			} else {
				toast.error("Failed to remove vote. Please try again.");
			}
		},
		onSettled: () => {
			// Always refetch after error or success
			void utils.photos.getById.invalidate({ id: photoId });
			if (categoryId) {
				void utils.photos.getByCategory.invalidate({ categoryId });
			}
			void utils.votes.getUserVotes.invalidate();
			void utils.votes.getVoteCounts.invalidate();
		},
	});

	return {
		vote: () => voteMutation.mutate({ photoId }),
		unvote: () => unvoteMutation.mutate({ photoId }),
		isLoading: voteMutation.isPending || unvoteMutation.isPending,
	};
}

/**
 * Hook to get vote data for a photo
 */
export function usePhotoVotes(photoId: string) {
	return trpc.votes.getPhotoVotes.useQuery(
		{ photoId },
		{
			staleTime: 1000 * 60 * 5, // 5 minutes
		},
	);
}

/**
 * Hook to get user's vote in a category
 */
export function useCategoryUserVote(categoryId: string) {
	return trpc.votes.getCategoryVote.useQuery(
		{ categoryId },
		{
			staleTime: 1000 * 60 * 5, // 5 minutes
		},
	);
}

/**
 * Hook to get vote counts for multiple photos
 */
export function useVoteCounts(photoIds: string[]) {
	return trpc.votes.getVoteCounts.useQuery(
		{ photoIds },
		{
			enabled: photoIds.length > 0,
			staleTime: 1000 * 60 * 5, // 5 minutes
		},
	);
}
