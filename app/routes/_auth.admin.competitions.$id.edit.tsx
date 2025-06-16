import { useParams } from "react-router";
import { CompetitionForm } from "~/components/admin/competition-form";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { trpc } from "~/lib/trpc";

export default function EditCompetitionPage() {
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

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Edit Competition</h1>
				<p className="text-gray-600">Modify competition details and settings</p>
			</div>

			<CompetitionForm mode="edit" competition={competition} />
		</div>
	);
}

export function meta() {
	return [
		{ title: "Edit Competition - Admin Dashboard" },
		{ name: "description", content: "Edit competition details" },
	];
}
