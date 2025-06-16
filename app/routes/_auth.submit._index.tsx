/**
 * Competition selection page for photo submissions
 */

import { CompetitionSelector } from "~/components/photo/competition-selector";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { trpc } from "~/lib/trpc";

export default function SubmitIndex() {
	const {
		data: competitions,
		isLoading,
		error,
	} = trpc.competitions.getActiveWithStats.useQuery();

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
					<p className="text-red-600 mb-4">Failed to load competitions</p>
					<p className="text-gray-600">{error.message}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				<CompetitionSelector competitions={competitions || []} />
			</div>
		</div>
	);
}
