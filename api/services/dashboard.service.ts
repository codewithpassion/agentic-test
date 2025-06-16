import { and, count, desc, eq, sql } from "drizzle-orm";
import type { Database } from "../database/db";
import {
	categories,
	competitions,
	photos,
	reports,
	user,
	votes,
} from "../database/schema";

export interface DashboardMetrics {
	activeCompetition: {
		id: string;
		title: string;
		totalPhotos: number;
		totalVotes: number;
		daysRemaining: number;
	} | null;
	pending: {
		photos: number;
		reports: number;
	};
	today: {
		newPhotos: number;
		newReports: number;
		newUsers: number;
		totalVotes: number;
	};
	users: {
		total: number;
		admins: number;
		activeToday: number;
	};
}

export class DashboardService {
	constructor(private db: Database) {}

	async getOverviewMetrics(): Promise<DashboardMetrics> {
		// Get active competition
		const activeCompetition = await this.db
			.select({
				id: competitions.id,
				title: competitions.title,
				endDate: competitions.endDate,
			})
			.from(competitions)
			.where(eq(competitions.status, "active"))
			.get();

		let competitionMetrics = null;
		if (activeCompetition) {
			// Get photo count for active competition
			const photoCount = await this.db
				.select({ count: count() })
				.from(photos)
				.innerJoin(categories, eq(photos.categoryId, categories.id))
				.where(eq(categories.competitionId, activeCompetition.id))
				.get();

			// Get vote count for active competition
			const voteCount = await this.db
				.select({ count: count() })
				.from(votes)
				.innerJoin(photos, eq(votes.photoId, photos.id))
				.innerJoin(categories, eq(photos.categoryId, categories.id))
				.where(eq(categories.competitionId, activeCompetition.id))
				.get();

			const endDate = activeCompetition.endDate
				? new Date(activeCompetition.endDate)
				: null;
			const now = new Date();
			const daysRemaining = endDate
				? Math.max(
						0,
						Math.ceil(
							(endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
						),
					)
				: 0;

			competitionMetrics = {
				id: activeCompetition.id,
				title: activeCompetition.title,
				totalPhotos: photoCount?.count || 0,
				totalVotes: voteCount?.count || 0,
				daysRemaining,
			};
		}

		// Get pending counts
		const pendingPhotos = await this.db
			.select({ count: count() })
			.from(photos)
			.where(eq(photos.status, "pending"))
			.get();

		const pendingReports = await this.db
			.select({ count: count() })
			.from(reports)
			.where(eq(reports.status, "pending"))
			.get();

		// Get today's activity
		const today = new Date().toISOString().split("T")[0];

		const todayPhotos = await this.db
			.select({ count: count() })
			.from(photos)
			.where(sql`DATE(${photos.createdAt}) = ${today}`)
			.get();

		const todayReports = await this.db
			.select({ count: count() })
			.from(reports)
			.where(sql`DATE(${reports.createdAt}) = ${today}`)
			.get();

		const todayUsers = await this.db
			.select({ count: count() })
			.from(user)
			.where(sql`DATE(${user.createdAt}) = ${today}`)
			.get();

		const todayVotes = await this.db
			.select({ count: count() })
			.from(votes)
			.where(sql`DATE(${votes.createdAt}) = ${today}`)
			.get();

		// Get user statistics
		const totalUsers = await this.db
			.select({ count: count() })
			.from(user)
			.get();

		const adminUsers = await this.db
			.select({ count: count() })
			.from(user)
			.where(sql`${user.roles} IN ('admin', 'superadmin')`)
			.get();

		return {
			activeCompetition: competitionMetrics,
			pending: {
				photos: pendingPhotos?.count || 0,
				reports: pendingReports?.count || 0,
			},
			today: {
				newPhotos: todayPhotos?.count || 0,
				newReports: todayReports?.count || 0,
				newUsers: todayUsers?.count || 0,
				totalVotes: todayVotes?.count || 0,
			},
			users: {
				total: totalUsers?.count || 0,
				admins: adminUsers?.count || 0,
				activeToday: 0, // Would need session tracking
			},
		};
	}

	async getCompetitionAnalytics(competitionId: string) {
		// Get competition details
		const competition = await this.db
			.select()
			.from(competitions)
			.where(eq(competitions.id, competitionId))
			.get();

		if (!competition) {
			throw new Error("Competition not found");
		}

		// Get photo statistics
		const photoStats = await this.db
			.select({
				status: photos.status,
				count: count(),
			})
			.from(photos)
			.innerJoin(categories, eq(photos.categoryId, categories.id))
			.where(eq(categories.competitionId, competitionId))
			.groupBy(photos.status);

		// Get photos by category
		const categoryStats = await this.db
			.select({
				categoryId: categories.id,
				categoryName: categories.name,
				photoCount: count(photos.id),
				voteCount: sql<number>`COUNT(${votes.id})`,
			})
			.from(categories)
			.leftJoin(
				photos,
				and(
					eq(categories.id, photos.categoryId),
					eq(categories.competitionId, competitionId),
				),
			)
			.leftJoin(votes, eq(photos.id, votes.photoId))
			.where(eq(categories.competitionId, competitionId))
			.groupBy(categories.id, categories.name);

		// Get total votes for competition
		const totalVotes = await this.db
			.select({ count: count() })
			.from(votes)
			.innerJoin(photos, eq(votes.photoId, photos.id))
			.innerJoin(categories, eq(photos.categoryId, categories.id))
			.where(eq(categories.competitionId, competitionId))
			.get();

		// Get daily submissions for last 30 days
		const dailySubmissions = await this.db
			.select({
				date: sql<string>`DATE(${photos.createdAt})`,
				count: count(),
			})
			.from(photos)
			.innerJoin(categories, eq(photos.categoryId, categories.id))
			.where(
				and(
					eq(categories.competitionId, competitionId),
					sql`${photos.createdAt} >= DATE('now', '-30 days')`,
				),
			)
			.groupBy(sql`DATE(${photos.createdAt})`)
			.orderBy(sql`DATE(${photos.createdAt})`);

		// Get top photographers
		const topPhotographers = await this.db
			.select({
				userId: user.id,
				email: user.email,
				photoCount: count(photos.id),
				totalVotes: sql<number>`COUNT(${votes.id})`,
			})
			.from(user)
			.innerJoin(photos, eq(user.id, photos.userId))
			.innerJoin(categories, eq(photos.categoryId, categories.id))
			.leftJoin(votes, eq(photos.id, votes.photoId))
			.where(eq(categories.competitionId, competitionId))
			.groupBy(user.id, user.email)
			.orderBy(desc(count(photos.id)))
			.limit(10);

		const photoStatsMap = photoStats.reduce(
			(acc, stat) => {
				acc[stat.status] = stat.count;
				return acc;
			},
			{} as Record<string, number>,
		);

		const totalPhotos = photoStats.reduce((sum, stat) => sum + stat.count, 0);
		const avgVotesPerPhoto =
			totalPhotos > 0 ? (totalVotes?.count || 0) / totalPhotos : 0;

		return {
			competition: {
				id: competition.id,
				title: competition.title,
				status: competition.status,
				startDate: competition.startDate,
				endDate: competition.endDate,
			},
			photos: {
				total: totalPhotos,
				approved: photoStatsMap.approved || 0,
				pending: photoStatsMap.pending || 0,
				rejected: photoStatsMap.rejected || 0,
				flagged: photoStatsMap.flagged || 0,
				byCategory: categoryStats.map((cat) => ({
					categoryId: cat.categoryId,
					categoryName: cat.categoryName,
					count: cat.photoCount,
					votes: cat.voteCount,
				})),
			},
			votes: {
				total: totalVotes?.count || 0,
				today: 0, // Would need date filtering
				avgPerPhoto: Number(avgVotesPerPhoto.toFixed(1)),
			},
			submissions: {
				dailySubmissions,
				topPhotographers,
			},
		};
	}

	async getUserList(
		filters: {
			role?: "user" | "admin" | "superadmin" | "all";
			search?: string;
			limit?: number;
			offset?: number;
		} = {},
	) {
		const { role = "all", search, limit = 50, offset = 0 } = filters;

		const baseQuery = this.db
			.select({
				id: user.id,
				email: user.email,
				role: user.roles,
				createdAt: user.createdAt,
			})
			.from(user);

		const conditions = [];

		if (role !== "all") {
			conditions.push(eq(user.roles, role));
		}

		if (search) {
			conditions.push(sql`${user.email} LIKE ${`%${search}%`}`);
		}

		const query =
			conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

		const userList = await query
			.limit(limit)
			.offset(offset)
			.orderBy(desc(user.createdAt));

		// Get user statistics
		const userStats = await Promise.all(
			userList.map(async (userRecord) => {
				const photoCount = await this.db
					.select({ count: count() })
					.from(photos)
					.where(eq(photos.userId, userRecord.id))
					.get();

				const votesReceived = await this.db
					.select({ count: count() })
					.from(votes)
					.innerJoin(photos, eq(votes.photoId, photos.id))
					.where(eq(photos.userId, userRecord.id))
					.get();

				const votesCast = await this.db
					.select({ count: count() })
					.from(votes)
					.where(eq(votes.userId, userRecord.id))
					.get();

				return {
					...userRecord,
					stats: {
						photosSubmitted: photoCount?.count || 0,
						votesReceived: votesReceived?.count || 0,
						votesCast: votesCast?.count || 0,
					},
				};
			}),
		);

		const total = await this.db
			.select({ count: count() })
			.from(user)
			.where(role !== "all" ? eq(user.roles, role) : undefined)
			.get();

		return {
			users: userStats,
			total: total?.count || 0,
			limit,
			offset,
		};
	}

	async getSystemStats() {
		// Get storage statistics
		const totalPhotos = await this.db
			.select({ count: count() })
			.from(photos)
			.get();

		const totalVotes = await this.db
			.select({ count: count() })
			.from(votes)
			.get();

		const totalReports = await this.db
			.select({ count: count() })
			.from(reports)
			.get();

		const totalUsers = await this.db
			.select({ count: count() })
			.from(user)
			.get();

		return {
			storage: {
				totalFiles: totalPhotos?.count || 0,
				totalSizeGB: 0, // Would calculate from file sizes
				avgFileSizeMB: 0, // Would calculate average
			},
			database: {
				totalPhotos: totalPhotos?.count || 0,
				totalVotes: totalVotes?.count || 0,
				totalReports: totalReports?.count || 0,
				totalUsers: totalUsers?.count || 0,
			},
			performance: {
				avgResponseTimeMs: 0, // Would need monitoring
				errorRate: 0, // Would need error tracking
				uptime: 99.8, // Would need uptime monitoring
			},
		};
	}
}
