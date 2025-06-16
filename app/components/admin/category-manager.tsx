import { Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import type { Category, Competition } from "~/../../api/database/schema";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { trpc } from "~/lib/trpc";

interface CategoryManagerProps {
	competition: Competition;
}

interface CategoryFormData {
	name: string;
	maxPhotosPerUser: number;
}

export function CategoryManager({ competition }: CategoryManagerProps) {
	const [isAdding, setIsAdding] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [formData, setFormData] = useState<CategoryFormData>({
		name: "",
		maxPhotosPerUser: 5,
	});

	const {
		data: categories,
		isLoading,
		error,
		refetch,
	} = trpc.categories.listByCompetition.useQuery({
		competitionId: competition.id,
	});

	const createMutation = trpc.categories.create.useMutation({
		onSuccess: () => {
			refetch();
			setIsAdding(false);
			setFormData({ name: "", maxPhotosPerUser: 5 });
		},
	});

	const updateMutation = trpc.categories.update.useMutation({
		onSuccess: () => {
			refetch();
			setEditingId(null);
		},
	});

	const deleteMutation = trpc.categories.delete.useMutation({
		onSuccess: () => {
			refetch();
		},
	});

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name.trim()) return;

		try {
			await createMutation.mutateAsync({
				name: formData.name.trim(),
				competitionId: competition.id,
				maxPhotosPerUser: formData.maxPhotosPerUser,
			});
		} catch (error) {
			console.error("Failed to create category:", error);
		}
	};

	const handleUpdate = async (category: Category, data: CategoryFormData) => {
		try {
			await updateMutation.mutateAsync({
				id: category.id,
				data: {
					name: data.name.trim(),
					maxPhotosPerUser: data.maxPhotosPerUser,
				},
			});
		} catch (error) {
			console.error("Failed to update category:", error);
		}
	};

	const handleDelete = async (category: Category) => {
		const confirmed = confirm(
			`Are you sure you want to delete the "${category.name}" category? This action cannot be undone.`,
		);
		if (!confirmed) return;

		try {
			await deleteMutation.mutateAsync({ id: category.id });
		} catch (error) {
			console.error("Failed to delete category:", error);
		}
	};

	const startEditing = (category: Category) => {
		setEditingId(category.id);
		setFormData({
			name: category.name,
			maxPhotosPerUser: category.maxPhotosPerUser,
		});
	};

	const cancelEditing = () => {
		setEditingId(null);
		setFormData({ name: "", maxPhotosPerUser: 5 });
	};

	const cancelAdding = () => {
		setIsAdding(false);
		setFormData({ name: "", maxPhotosPerUser: 5 });
	};

	if (error) {
		return (
			<Card>
				<CardContent className="flex items-center justify-center h-32">
					<div className="text-center">
						<p className="text-red-600">Failed to load categories</p>
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
		<div className="space-y-6">
			{/* Header */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Categories for "{competition.title}"</CardTitle>
							<p className="text-sm text-gray-600 mt-1">
								Manage photo submission categories and their limits
							</p>
						</div>
						<Button asChild variant="outline">
							<Link to={`/admin/competitions/${competition.id}`}>
								Back to Competition
							</Link>
						</Button>
					</div>
				</CardHeader>
			</Card>

			{/* Add New Category */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">
						{isAdding ? "Add New Category" : "Categories"}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{!isAdding ? (
						<Button onClick={() => setIsAdding(true)}>
							<Plus className="h-4 w-4 mr-2" />
							Add Category
						</Button>
					) : (
						<form onSubmit={handleCreate} className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="name"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Category Name *
									</label>
									<Input
										id="name"
										value={formData.name}
										onChange={(e) =>
											setFormData({ ...formData, name: e.target.value })
										}
										placeholder="Enter category name..."
										required
									/>
								</div>
								<div>
									<label
										htmlFor="maxPhotos"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Max Photos per User *
									</label>
									<Input
										id="maxPhotos"
										type="number"
										min="1"
										max="20"
										value={formData.maxPhotosPerUser}
										onChange={(e) =>
											setFormData({
												...formData,
												maxPhotosPerUser: Number.parseInt(e.target.value) || 1,
											})
										}
										required
									/>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Button
									type="submit"
									disabled={createMutation.isPending || !formData.name.trim()}
								>
									{createMutation.isPending ? (
										<LoadingSpinner className="h-4 w-4" />
									) : (
										"Add Category"
									)}
								</Button>
								<Button type="button" variant="outline" onClick={cancelAdding}>
									Cancel
								</Button>
							</div>
							{createMutation.error && (
								<p className="text-red-500 text-sm">
									{createMutation.error.message}
								</p>
							)}
						</form>
					)}
				</CardContent>
			</Card>

			{/* Categories List */}
			<Card>
				<CardHeader>
					<CardTitle>Existing Categories ({categories?.length || 0})</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center justify-center h-32">
							<LoadingSpinner />
						</div>
					) : !categories || categories.length === 0 ? (
						<div className="text-center py-8 text-gray-500">
							<p className="text-lg mb-2">No categories yet</p>
							<p className="text-sm mb-4">
								Add categories to organize photo submissions
							</p>
							{!isAdding && (
								<Button onClick={() => setIsAdding(true)}>
									<Plus className="h-4 w-4 mr-2" />
									Add First Category
								</Button>
							)}
						</div>
					) : (
						<div className="space-y-4">
							{categories.map((category) => (
								<div
									key={category.id}
									className="border border-gray-200 rounded-lg p-4"
								>
									{editingId === category.id ? (
										// Edit form
										<form
											onSubmit={(e) => {
												e.preventDefault();
												handleUpdate(category, formData);
											}}
											className="space-y-4"
										>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label
														htmlFor="edit-category-name"
														className="block text-sm font-medium text-gray-700 mb-1"
													>
														Category Name *
													</label>
													<Input
														id="edit-category-name"
														value={formData.name}
														onChange={(e) =>
															setFormData({ ...formData, name: e.target.value })
														}
														required
													/>
												</div>
												<div>
													<label
														htmlFor="edit-max-photos"
														className="block text-sm font-medium text-gray-700 mb-1"
													>
														Max Photos per User *
													</label>
													<Input
														id="edit-max-photos"
														type="number"
														min="1"
														max="20"
														value={formData.maxPhotosPerUser}
														onChange={(e) =>
															setFormData({
																...formData,
																maxPhotosPerUser:
																	Number.parseInt(e.target.value) || 1,
															})
														}
														required
													/>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<Button
													type="submit"
													size="sm"
													disabled={
														updateMutation.isPending || !formData.name.trim()
													}
												>
													{updateMutation.isPending ? (
														<LoadingSpinner className="h-4 w-4" />
													) : (
														"Save"
													)}
												</Button>
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={cancelEditing}
												>
													Cancel
												</Button>
											</div>
											{updateMutation.error && (
												<p className="text-red-500 text-sm">
													{updateMutation.error.message}
												</p>
											)}
										</form>
									) : (
										// Display mode
										<div className="flex items-center justify-between">
											<div className="flex-1">
												<h4 className="font-semibold text-lg mb-1">
													{category.name}
												</h4>
												<div className="text-sm text-gray-600">
													<p>
														Max photos per user: {category.maxPhotosPerUser}
													</p>
													<p className="text-xs text-gray-400 mt-1">
														Created{" "}
														{new Date(category.createdAt).toLocaleDateString()}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => startEditing(category)}
													disabled={editingId !== null || isAdding}
												>
													<Edit className="h-4 w-4 mr-1" />
													Edit
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleDelete(category)}
													disabled={deleteMutation.isPending}
													className="text-red-600 hover:text-red-700"
												>
													<Trash2 className="h-4 w-4 mr-1" />
													Delete
												</Button>
											</div>
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Quick Tips */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Tips</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="text-sm text-gray-600 space-y-2">
						<li>• Category names must be unique within this competition</li>
						<li>
							• Photo limits can be set between 1-20 per user per category
						</li>
						<li>
							• Default categories "Urban" and "Landscape" are created
							automatically
						</li>
						<li>
							• Categories cannot be deleted if they have photo submissions
						</li>
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}
