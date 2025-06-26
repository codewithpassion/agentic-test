import { TRPCError } from "@trpc/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { photos, votes } from "../../database/schema";
import { protectedProcedure, publicProcedure, router } from "../router";

export const votesRouter = router({
	/**
	 * Vote for a photo (enforces one vote per category per user)
	 */
	vote: protectedProcedure
		.input(
			z.object({
				photoId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { db, user } = ctx;
			const { photoId } = input;

			// Get the photo to find its category
			const photo = await db
				.select({
					id: photos.id,
					categoryId: photos.categoryId,
					competitionId: photos.competitionId,
					status: photos.status,
				})
				.from(photos)
				.where(eq(photos.id, photoId))
				.get();

			if (!photo) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Photo not found",
				});
			}

			// Only allow voting on approved photos
			if (photo.status !== "approved") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Cannot vote for photos that are not approved",
				});
			}

			// Check if user has already voted in this category
			const existingVote = await db
				.select({
					voteId: votes.id,
					photoId: votes.photoId,
				})
				.from(votes)
				.innerJoin(photos, eq(votes.photoId, photos.id))
				.where(
					and(
						eq(votes.userId, user.id),
						eq(photos.categoryId, photo.categoryId),
					),
				)
				.get();

			// If user has voted in this category, handle the logic
			if (existingVote) {
				// Don't allow voting for the same photo again
				if (existingVote.photoId === photoId) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "You have already voted for this photo",
					});
				}

				// Remove the old vote
				await db.delete(votes).where(eq(votes.id, existingVote.voteId));
			}

			// Add the new vote
			const newVoteId = crypto.randomUUID();
			await db.insert(votes).values({
				id: newVoteId,
				userId: user.id,
				photoId,
				createdAt: new Date(),
			});

			// Get updated vote count - try a different approach
			const allVotes = await db
				.select()
				.from(votes)
				.where(eq(votes.photoId, photoId));

			const voteCount = allVotes.length;

			console.log("Vote added:", {
				newVoteId,
				photoId,
				userId: user.id,
				voteCount: voteCount,
				allVotes: allVotes.map((v) => ({ id: v.id, userId: v.userId })),
			});

			return {
				success: true,
				photoId,
				voteCount: voteCount,
				previousVotePhotoId: existingVote?.photoId,
			};
		}),

	/**
	 * Remove vote from a photo
	 */
	unvote: protectedProcedure
		.input(
			z.object({
				photoId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { db, user } = ctx;
			const { photoId } = input;

			// Check if vote exists
			const existingVote = await db
				.select()
				.from(votes)
				.where(and(eq(votes.userId, user.id), eq(votes.photoId, photoId)))
				.get();

			if (!existingVote) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Vote not found",
				});
			}

			// Remove the vote
			await db.delete(votes).where(eq(votes.id, existingVote.id));

			// Get updated vote count - use same approach as vote
			const allVotes = await db
				.select()
				.from(votes)
				.where(eq(votes.photoId, photoId));

			const voteCount = allVotes.length;

			return {
				success: true,
				photoId,
				voteCount: voteCount,
			};
		}),

	/**
	 * Get all votes by the current user
	 */
	getUserVotes: protectedProcedure.query(async ({ ctx }) => {
		const { db, user } = ctx;

		const userVotes = await db
			.select({
				voteId: votes.id,
				photoId: votes.photoId,
				votedAt: votes.createdAt,
				photo: {
					id: photos.id,
					title: photos.title,
					categoryId: photos.categoryId,
					competitionId: photos.competitionId,
				},
			})
			.from(votes)
			.innerJoin(photos, eq(votes.photoId, photos.id))
			.where(eq(votes.userId, user.id))
			.orderBy(sql`${votes.createdAt} DESC`);

		return userVotes;
	}),

	/**
	 * Get vote count for a specific photo
	 */
	getPhotoVotes: publicProcedure
		.input(
			z.object({
				photoId: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { db, user } = ctx;
			const { photoId } = input;

			// Get vote count
			const voteCount = await db
				.select({
					count: sql<number>`count(*)`,
				})
				.from(votes)
				.where(eq(votes.photoId, photoId))
				.get();

			// Check if current user has voted (if authenticated)
			let hasVoted = false;
			if (user) {
				const userVote = await db
					.select()
					.from(votes)
					.where(and(eq(votes.userId, user.id), eq(votes.photoId, photoId)))
					.get();
				hasVoted = !!userVote;
			}

			return {
				photoId,
				voteCount: voteCount?.count || 0,
				hasVoted,
			};
		}),

	/**
	 * Get user's vote in a specific category
	 */
	getCategoryVote: protectedProcedure
		.input(
			z.object({
				categoryId: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { db, user } = ctx;
			const { categoryId } = input;

			const userVote = await db
				.select({
					voteId: votes.id,
					photoId: votes.photoId,
					votedAt: votes.createdAt,
				})
				.from(votes)
				.innerJoin(photos, eq(votes.photoId, photos.id))
				.where(
					and(eq(votes.userId, user.id), eq(photos.categoryId, categoryId)),
				)
				.get();

			return userVote || null;
		}),

	/**
	 * Get vote counts for multiple photos (batch operation)
	 */
	getVoteCounts: publicProcedure
		.input(
			z.object({
				photoIds: z.array(z.string()),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { db, user } = ctx;
			const { photoIds } = input;

			if (photoIds.length === 0) {
				return {
					voteCounts: {},
					userVotes: [],
				};
			}

			// Get vote counts for all photos
			const voteCounts = await db
				.select({
					photoId: votes.photoId,
					count: sql<number>`count(*)`,
				})
				.from(votes)
				.where(inArray(votes.photoId, photoIds))
				.groupBy(votes.photoId);

			// Get user's votes if authenticated
			let userVotes: string[] = [];
			if (user) {
				const userVoteRecords = await db
					.select({
						photoId: votes.photoId,
					})
					.from(votes)
					.where(
						and(eq(votes.userId, user.id), inArray(votes.photoId, photoIds)),
					);
				userVotes = userVoteRecords.map((v) => v.photoId);
			}

			// Convert to map for easy lookup
			const voteCountMap: Record<string, number> = {};
			for (const { photoId, count } of voteCounts) {
				voteCountMap[photoId] = count;
			}

			// Ensure all requested photos have a count (even if 0)
			for (const photoId of photoIds) {
				if (!voteCountMap[photoId]) {
					voteCountMap[photoId] = 0;
				}
			}

			return {
				voteCounts: voteCountMap,
				userVotes,
			};
		}),
});
