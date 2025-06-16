/**
 * Category selection page for a specific competition
 */

import { useParams } from "react-router";
import { CategorySelector } from "~/components/photo/category-selector";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { trpc } from "~/lib/trpc";

export default function SubmitCompetition() {
	const { competitionId } = useParams();

	const {
		data: competitionData,
		isLoading,
		error,
	} = trpc.competitions.getCategoriesWithStats.useQuery(
		{ competitionId: competitionId ?? "" },
		{ enabled: !!competitionId },
	);

	if (!competitionId) {
		return (
			<div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-600">Competition ID is required</p>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
				<LoadingSpinner className="h-8 w-8" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-600 mb-4">Failed to load competition data</p>
					<p className="text-gray-600">{error.message}</p>
				</div>
			</div>
		);
	}

	if (!competitionData) {
		return (
			<div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
				<div className="text-center">
					<p className="text-gray-600">Competition not found</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				<CategorySelector
					competition={competitionData.competition}
					categories={competitionData.categories}
				/>
			</div>
		</div>
	);
}
