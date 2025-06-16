import { useParams } from "react-router";
import { CategoryManager } from "~/components/admin/category-manager";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { trpc } from "~/lib/trpc";

export default function CompetitionCategoriesPage() {
	const { id } = useParams();

	const {
		data: competition,
		isLoading,
		error,
	} = trpc.competitions.getById.useQuery({ id: id || "" }, { enabled: !!id });

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<LoadingSpinner />
			</div>
		);
	}

	if (error || !competition) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center">
					<p className="text-red-600">Competition not found</p>
					<p className="text-sm text-gray-500 mt-1">
						{error?.message ||
							"The competition you're looking for doesn't exist."}
					</p>
				</div>
			</div>
		);
	}

	return <CategoryManager competition={competition} />;
}

export function meta() {
	return [
		{ title: "Manage Categories - Admin Dashboard" },
		{ name: "description", content: "Manage competition categories" },
	];
}
