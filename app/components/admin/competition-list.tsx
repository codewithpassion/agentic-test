import {
	Calendar,
	Edit,
	MoreHorizontal,
	Plus,
	Search,
	Trophy,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import type { Competition } from "~/../../api/database/schema";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { trpc } from "~/lib/trpc";

interface CompetitionListProps {
	className?: string;
}

type CompetitionStatus = "active" | "inactive" | "draft" | "completed" | "all";

export function CompetitionList({ className }: CompetitionListProps) {
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<CompetitionStatus>("all");
	const [currentPage, setCurrentPage] = useState(0);
	const pageSize = 20;

	const {
		data: competitions,
		isLoading,
		error,
		refetch,
	} = trpc.competitions.list.useQuery({
		status: status === "all" ? undefined : status,
		limit: pageSize,
		offset: currentPage * pageSize,
	});

	const utils = trpc.useUtils();

	const activateMutation = trpc.competitions.activate.useMutation({
		onSuccess: () => {
			// Invalidate all related queries
			utils.competitions.list.invalidate();
			utils.competitions.getActive.invalidate();
			// Also invalidate any specific competition detail queries
			utils.competitions.getById.invalidate();
		},
	});

	const deactivateMutation = trpc.competitions.deactivate.useMutation({
		onSuccess: () => {
			// Invalidate all related queries
			utils.competitions.list.invalidate();
			utils.competitions.getActive.invalidate();
			// Also invalidate any specific competition detail queries
			utils.competitions.getById.invalidate();
		},
	});

	const deleteMutation = trpc.competitions.delete.useMutation({
		onSuccess: () => {
			// Invalidate all related queries
			utils.competitions.list.invalidate();
			utils.competitions.getActive.invalidate();
			utils.competitions.getById.invalidate();
		},
	});

	const filteredCompetitions = competitions?.filter((competition) =>
		search === ""
			? true
			: competition.title.toLowerCase().includes(search.toLowerCase()),
	);

	const handleActivate = async (competitionId: string) => {
		try {
			await activateMutation.mutateAsync({ id: competitionId });
		} catch (error) {
			console.error("Failed to activate competition:", error);
		}
	};

	const handleDeactivate = async (competitionId: string) => {
		try {
			await deactivateMutation.mutateAsync({ id: competitionId });
		} catch (error) {
			console.error("Failed to deactivate competition:", error);
		}
	};

	const handleDelete = async (competitionId: string) => {
		if (
			confirm(
				"Are you sure you want to delete this competition? This action cannot be undone.",
			)
		) {
			try {
				await deleteMutation.mutateAsync({ id: competitionId });
			} catch (error) {
				console.error("Failed to delete competition:", error);
			}
		}
	};

	const getStatusBadge = (competitionStatus: Competition["status"]) => {
		switch (competitionStatus) {
			case "active":
				return <Badge variant="active">Active</Badge>;
			case "draft":
				return <Badge variant="draft">Draft</Badge>;
			case "completed":
				return <Badge variant="completed">Completed</Badge>;
			case "inactive":
				return <Badge variant="inactive">Inactive</Badge>;
			default:
				return <Badge variant="secondary">{competitionStatus}</Badge>;
		}
	};

	const formatDate = (date: Date | string | null) => {
		if (!date) return "Not set";
		return new Date(date).toLocaleDateString();
	};

	if (error) {
		return (
			<Card className={className}>
				<CardContent className="flex items-center justify-center h-64">
					<div className="text-center">
						<p className="text-red-600">Failed to load competitions</p>
						<p className="text-sm text-gray-500 mt-1">{error.message}</p>
						<Button onClick={() => refetch()} className="mt-4">
							Try Again
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className={className}>
			{/* Header with controls */}
			<div className="flex flex-col sm:flex-row gap-4 mb-6">
				<div className="flex items-center space-x-2 flex-1">
					<div className="relative flex-1 max-w-sm">
						<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search competitions..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-8"
						/>
					</div>
					<select
						value={status}
						onChange={(e) => setStatus(e.target.value as CompetitionStatus)}
						className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="all">All Status</option>
						<option value="active">Active</option>
						<option value="draft">Draft</option>
						<option value="completed">Completed</option>
						<option value="inactive">Inactive</option>
					</select>
				</div>
				<Button asChild>
					<Link to="/admin/competitions/new">
						<Plus className="h-4 w-4 mr-2" />
						New Competition
					</Link>
				</Button>
			</div>

			{/* Competition list */}
			{isLoading ? (
				<Card>
					<CardContent className="flex items-center justify-center h-64">
						<LoadingSpinner />
					</CardContent>
				</Card>
			) : !filteredCompetitions || filteredCompetitions.length === 0 ? (
				<Card>
					<CardContent className="flex items-center justify-center h-64">
						<div className="text-center">
							<Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
							<p className="text-gray-500 text-lg mb-2">
								{search || status !== "all"
									? "No competitions found"
									: "No competitions yet"}
							</p>
							<p className="text-gray-400 text-sm mb-4">
								{search || status !== "all"
									? "Try adjusting your search or filter"
									: "Create your first competition to get started"}
							</p>
							{!search && status === "all" && (
								<Button asChild>
									<Link to="/admin/competitions/new">
										<Plus className="h-4 w-4 mr-2" />
										Create Competition
									</Link>
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4">
					{filteredCompetitions.map((competition) => (
						<Card
							key={competition.id}
							className="hover:shadow-md transition-shadow"
						>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="flex items-center gap-3 mb-2">
											<CardTitle className="text-lg">
												<Link
													to={`/admin/competitions/${competition.id}`}
													className="hover:text-blue-600 transition-colors"
												>
													{competition.title}
												</Link>
											</CardTitle>
											{getStatusBadge(competition.status)}
										</div>
										<p className="text-gray-600 text-sm line-clamp-2">
											{competition.description}
										</p>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" className="h-8 w-8 p-0">
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem asChild>
												<Link to={`/admin/competitions/${competition.id}`}>
													View Details
												</Link>
											</DropdownMenuItem>
											<DropdownMenuItem asChild>
												<Link to={`/admin/competitions/${competition.id}/edit`}>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</Link>
											</DropdownMenuItem>
											<DropdownMenuItem asChild>
												<Link
													to={`/admin/competitions/${competition.id}/categories`}
												>
													Manage Categories
												</Link>
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											{competition.status === "active" ? (
												<DropdownMenuItem
													onClick={() => handleDeactivate(competition.id)}
													disabled={deactivateMutation.isPending}
												>
													Deactivate
												</DropdownMenuItem>
											) : (
												<DropdownMenuItem
													onClick={() => handleActivate(competition.id)}
													disabled={activateMutation.isPending}
												>
													Activate
												</DropdownMenuItem>
											)}
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={() => handleDelete(competition.id)}
												disabled={deleteMutation.isPending}
												className="text-red-600 focus:text-red-600"
											>
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
									<div>
										<p className="text-gray-500">Start Date</p>
										<p className="font-medium">
											{formatDate(competition.startDate)}
										</p>
									</div>
									<div>
										<p className="text-gray-500">End Date</p>
										<p className="font-medium">
											{formatDate(competition.endDate)}
										</p>
									</div>
									<div>
										<p className="text-gray-500">Created</p>
										<p className="font-medium">
											{formatDate(competition.createdAt)}
										</p>
									</div>
									<div>
										<p className="text-gray-500">Status</p>
										<p className="font-medium capitalize">
											{competition.status}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Pagination (basic implementation) */}
			{filteredCompetitions && filteredCompetitions.length >= pageSize && (
				<div className="flex justify-center mt-6">
					<div className="flex items-center space-x-2">
						<Button
							variant="outline"
							onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
							disabled={currentPage === 0}
						>
							Previous
						</Button>
						<span className="text-sm text-gray-500">
							Page {currentPage + 1}
						</span>
						<Button
							variant="outline"
							onClick={() => setCurrentPage(currentPage + 1)}
							disabled={filteredCompetitions.length < pageSize}
						>
							Next
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
