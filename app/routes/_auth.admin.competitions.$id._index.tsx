import { useNavigate, useParams } from "react-router";
import { CompetitionDetail } from "~/components/admin/competition-detail";
import { Button } from "~/components/ui/button";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { trpc } from "~/lib/trpc";

export default function CompetitionDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();

	const {
		data: competition,
		isLoading,
		error,
		refetch,
	} = trpc.competitions.getById.useQuery({ id: id || "" }, { enabled: !!id });

	// Handle competition deletion navigation
	const utils = trpc.useUtils();

	// Listen for competition deletion to navigate away
	const handleCompetitionUpdate = () => {
		refetch();
		utils.competitions.list.invalidate();
	};

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
					<p className="text-red-600 text-lg mb-2">Competition not found</p>
					<p className="text-sm text-gray-500 mb-4">
						{error?.message ||
							"The competition you're looking for doesn't exist."}
					</p>
					<Button onClick={() => navigate("/admin/competitions")}>
						Back to Competitions
					</Button>
				</div>
			</div>
		);
	}

	return (
		<CompetitionDetail
			competition={competition}
			onCompetitionUpdate={handleCompetitionUpdate}
		/>
	);
}

export function meta() {
	return [
		{ title: "Competition Details - Admin Dashboard" },
		{ name: "description", content: "View and manage competition details" },
	];
}
