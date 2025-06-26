import { TRPCError } from "@trpc/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { photos, votes } from "../../database/schema";
import { protectedProcedure, publicProcedure, router } from "../router";

export const votesRouter = router({
	/**
	 * Vote for a photo (enforces 3 votes per user per competition)
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

			// Get the photo to find its category and competition
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

			// Check if user has already voted for this specific photo
			const existingVoteForPhoto = await db
				.select()
				.from(votes)
				.where(and(eq(votes.userId, user.id), eq(votes.photoId, photoId)))
				.get();

			if (existingVoteForPhoto) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "You have already voted for this photo",
				});
			}

			// Count user's total votes in this competition
			const userVotesInCompetition = await db
				.select({
					voteId: votes.id,
				})
				.from(votes)
				.innerJoin(photos, eq(votes.photoId, photos.id))
				.where(
					and(
						eq(votes.userId, user.id),
						eq(photos.competitionId, photo.competitionId),
					),
				);

			const totalVotes = userVotesInCompetition.length;

			// Check if user has reached the 3-vote limit
			if (totalVotes >= 3) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"You've used all 3 votes. Remove a vote to vote for another photo.",
				});
			}

			// Add the new vote
			const newVoteId = crypto.randomUUID();
			await db.insert(votes).values({
				id: newVoteId,
				userId: user.id,
				photoId,
				createdAt: new Date(),
			});

			// Get updated vote count for the photo
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
				userTotalVotes: totalVotes + 1,
			});

			return {
				success: true,
				photoId,
				voteCount: voteCount,
				userTotalVotes: totalVotes + 1,
				remainingVotes: 3 - (totalVotes + 1),
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

			// Get the photo to find its competition
			const photo = await db
				.select({
					competitionId: photos.competitionId,
				})
				.from(photos)
				.where(eq(photos.id, photoId))
				.get();

			// Remove the vote
			await db.delete(votes).where(eq(votes.id, existingVote.id));

			// Get updated vote count for the photo
			const allVotes = await db
				.select()
				.from(votes)
				.where(eq(votes.photoId, photoId));

			const voteCount = allVotes.length;

			// Count user's remaining votes in this competition
			const userVotesInCompetition = await db
				.select({
					voteId: votes.id,
				})
				.from(votes)
				.innerJoin(photos, eq(votes.photoId, photos.id))
				.where(
					and(
						eq(votes.userId, user.id),
						eq(photos.competitionId, photo?.competitionId || ""),
					),
				);

			const totalVotes = userVotesInCompetition.length;

			return {
				success: true,
				photoId,
				voteCount: voteCount,
				userTotalVotes: totalVotes,
				remainingVotes: 3 - totalVotes,
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

	/**
	 * Get user's vote statistics for a competition
	 */
	getUserVoteStats: protectedProcedure
		.input(
			z.object({
				competitionId: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { db, user } = ctx;
			const { competitionId } = input;

			// Get all user's votes in this competition
			const userVotes = await db
				.select({
					voteId: votes.id,
					photoId: votes.photoId,
					votedAt: votes.createdAt,
					photo: {
						id: photos.id,
						title: photos.title,
						categoryId: photos.categoryId,
						categoryName: photos.categoryId,
					},
				})
				.from(votes)
				.innerJoin(photos, eq(votes.photoId, photos.id))
				.where(
					and(
						eq(votes.userId, user.id),
						eq(photos.competitionId, competitionId),
					),
				)
				.orderBy(sql`${votes.createdAt} DESC`);

			const totalVotes = userVotes.length;
			const remainingVotes = 3 - totalVotes;

			return {
				totalVotes,
				remainingVotes,
				maxVotes: 3,
				votes: userVotes,
			};
		}),
});
