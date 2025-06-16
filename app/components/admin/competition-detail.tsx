import {
	Calendar,
	Edit,
	MoreHorizontal,
	Settings,
	Tag,
	Trash2,
	Users,
} from "lucide-react";
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
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { trpc } from "~/lib/trpc";

interface CompetitionDetailProps {
	competition: Competition;
}

export function CompetitionDetail({ competition }: CompetitionDetailProps) {
	const {
		data: categories,
		isLoading: categoriesLoading,
		refetch: refetchCategories,
	} = trpc.categories.listByCompetition.useQuery({
		competitionId: competition.id,
	});

	const { data: activeCompetition } = trpc.competitions.getActive.useQuery();

	const activateMutation = trpc.competitions.activate.useMutation({
		onSuccess: () => {
			// Refetch competition data will be handled by parent component
		},
	});

	const deactivateMutation = trpc.competitions.deactivate.useMutation({
		onSuccess: () => {
			// Refetch competition data will be handled by parent component
		},
	});

	const deleteMutation = trpc.competitions.delete.useMutation({
		onSuccess: () => {
			// Navigation will be handled by parent component
		},
	});

	const handleActivate = async () => {
		if (activeCompetition && activeCompetition.id !== competition.id) {
			const confirmed = confirm(
				`Activating this competition will deactivate "${activeCompetition.title}". Continue?`,
			);
			if (!confirmed) return;
		}

		try {
			await activateMutation.mutateAsync({ id: competition.id });
		} catch (error) {
			console.error("Failed to activate competition:", error);
		}
	};

	const handleDeactivate = async () => {
		try {
			await deactivateMutation.mutateAsync({ id: competition.id });
		} catch (error) {
			console.error("Failed to deactivate competition:", error);
		}
	};

	const handleDelete = async () => {
		const confirmed = confirm(
			"Are you sure you want to delete this competition? This action cannot be undone and will remove all associated data.",
		);
		if (confirmed) {
			try {
				await deleteMutation.mutateAsync({ id: competition.id });
			} catch (error) {
				console.error("Failed to delete competition:", error);
			}
		}
	};

	const getStatusBadge = (status: Competition["status"]) => {
		switch (status) {
			case "active":
				return (
					<Badge className="bg-green-100 text-green-800 border-green-200">
						Active
					</Badge>
				);
			case "draft":
				return <Badge variant="secondary">Draft</Badge>;
			case "completed":
				return (
					<Badge className="bg-blue-100 text-blue-800 border-blue-200">
						Completed
					</Badge>
				);
			case "inactive":
				return (
					<Badge className="bg-orange-100 text-orange-800 border-orange-200">
						Inactive
					</Badge>
				);
			default:
				return <Badge variant="secondary">{status}</Badge>;
		}
	};

	const formatDate = (date: Date | string | null) => {
		if (!date) return "Not set";
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const formatDateTime = (date: Date | string | null) => {
		if (!date) return "Not set";
		return new Date(date).toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getDaysRemaining = () => {
		if (!competition.endDate) return null;
		const end = new Date(competition.endDate);
		const now = new Date();
		const diffTime = end.getTime() - now.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	};

	const daysRemaining = getDaysRemaining();

	return (
		<div className="space-y-6">
			{/* Header */}
			<Card>
				<CardHeader>
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<div className="flex items-center gap-3 mb-2">
								<CardTitle className="text-2xl">{competition.title}</CardTitle>
								{getStatusBadge(competition.status)}
							</div>
							<p className="text-gray-600">{competition.description}</p>
						</div>
						<div className="flex items-center gap-2">
							<Button asChild variant="outline">
								<Link to={`/admin/competitions/${competition.id}/edit`}>
									<Edit className="h-4 w-4 mr-2" />
									Edit
								</Link>
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="icon">
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem asChild>
										<Link
											to={`/admin/competitions/${competition.id}/categories`}
										>
											<Tag className="h-4 w-4 mr-2" />
											Manage Categories
										</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									{competition.status === "active" ? (
										<DropdownMenuItem
											onClick={handleDeactivate}
											disabled={deactivateMutation.isPending}
										>
											Deactivate Competition
										</DropdownMenuItem>
									) : (
										<DropdownMenuItem
											onClick={handleActivate}
											disabled={activateMutation.isPending}
										>
											Activate Competition
										</DropdownMenuItem>
									)}
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={handleDelete}
										disabled={deleteMutation.isPending}
										className="text-red-600 focus:text-red-600"
									>
										<Trash2 className="h-4 w-4 mr-2" />
										Delete Competition
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</CardHeader>
			</Card>

			{/* Statistics Overview */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<Tag className="h-8 w-8 text-blue-600" />
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-500">Categories</p>
								<p className="text-2xl font-bold">
									{categoriesLoading ? "-" : categories?.length || 0}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<Users className="h-8 w-8 text-green-600" />
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-500">Submissions</p>
								<p className="text-2xl font-bold">-</p>
								<p className="text-xs text-gray-400">Coming in Phase 3</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<Calendar className="h-8 w-8 text-purple-600" />
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-500">
									Days Remaining
								</p>
								<p className="text-2xl font-bold">
									{daysRemaining === null
										? "-"
										: daysRemaining > 0
											? daysRemaining
											: "Ended"}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<Settings className="h-8 w-8 text-orange-600" />
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-500">Status</p>
								<p className="text-lg font-semibold capitalize">
									{competition.status}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Competition Timeline */}
			<Card>
				<CardHeader>
					<CardTitle>Competition Timeline</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="text-center">
							<div className="text-sm font-medium text-gray-500 mb-1">
								Start Date
							</div>
							<div className="text-lg font-semibold">
								{formatDate(competition.startDate)}
							</div>
						</div>
						<div className="text-center">
							<div className="text-sm font-medium text-gray-500 mb-1">
								End Date
							</div>
							<div className="text-lg font-semibold">
								{formatDate(competition.endDate)}
							</div>
						</div>
						<div className="text-center">
							<div className="text-sm font-medium text-gray-500 mb-1">
								Duration
							</div>
							<div className="text-lg font-semibold">
								{competition.startDate && competition.endDate
									? `${Math.ceil(
											(new Date(competition.endDate).getTime() -
												new Date(competition.startDate).getTime()) /
												(1000 * 60 * 60 * 24),
										)} days`
									: "Not set"}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Categories Section */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Categories</CardTitle>
						<Button asChild variant="outline">
							<Link to={`/admin/competitions/${competition.id}/categories`}>
								<Tag className="h-4 w-4 mr-2" />
								Manage Categories
							</Link>
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{categoriesLoading ? (
						<div className="flex items-center justify-center h-32">
							<LoadingSpinner />
						</div>
					) : !categories || categories.length === 0 ? (
						<div className="text-center py-8 text-gray-500">
							<Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
							<p className="text-lg mb-2">No categories yet</p>
							<p className="text-sm mb-4">
								Categories help organize photo submissions
							</p>
							<Button asChild variant="outline">
								<Link to={`/admin/competitions/${competition.id}/categories`}>
									Add Categories
								</Link>
							</Button>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{categories.map((category) => (
								<div
									key={category.id}
									className="border border-gray-200 rounded-lg p-4"
								>
									<h4 className="font-semibold text-lg mb-2">
										{category.name}
									</h4>
									<div className="text-sm text-gray-600">
										<p>Max photos per user: {category.maxPhotosPerUser}</p>
										<p className="text-xs text-gray-400 mt-2">
											Created {formatDateTime(category.createdAt)}
										</p>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Competition Details */}
			<Card>
				<CardHeader>
					<CardTitle>Competition Details</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<h4 className="font-semibold mb-2">General Information</h4>
							<dl className="space-y-2 text-sm">
								<div className="flex justify-between">
									<dt className="text-gray-500">ID:</dt>
									<dd className="font-mono text-xs">{competition.id}</dd>
								</div>
								<div className="flex justify-between">
									<dt className="text-gray-500">Created:</dt>
									<dd>{formatDateTime(competition.createdAt)}</dd>
								</div>
								<div className="flex justify-between">
									<dt className="text-gray-500">Last Updated:</dt>
									<dd>{formatDateTime(competition.updatedAt)}</dd>
								</div>
							</dl>
						</div>
						<div>
							<h4 className="font-semibold mb-2">Quick Actions</h4>
							<div className="space-y-2">
								<Button
									asChild
									variant="outline"
									className="w-full justify-start"
								>
									<Link to={`/admin/competitions/${competition.id}/edit`}>
										<Edit className="h-4 w-4 mr-2" />
										Edit Competition
									</Link>
								</Button>
								<Button
									asChild
									variant="outline"
									className="w-full justify-start"
								>
									<Link to={`/admin/competitions/${competition.id}/categories`}>
										<Tag className="h-4 w-4 mr-2" />
										Manage Categories
									</Link>
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Loading/Error States for mutations */}
			{(activateMutation.isPending ||
				deactivateMutation.isPending ||
				deleteMutation.isPending) && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<Card className="p-6">
						<div className="flex items-center space-x-4">
							<LoadingSpinner />
							<p>
								{activateMutation.isPending && "Activating competition..."}
								{deactivateMutation.isPending && "Deactivating competition..."}
								{deleteMutation.isPending && "Deleting competition..."}
							</p>
						</div>
					</Card>
				</div>
			)}
		</div>
	);
}
