import { CompetitionList } from "~/components/admin/competition-list";

export default function AdminCompetitionsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Competition Management</h1>
				<p className="text-gray-600">Create and manage photo competitions</p>
			</div>

			<CompetitionList />
		</div>
	);
}

export function meta() {
	return [
		{ title: "Competitions - Admin Dashboard" },
		{ name: "description", content: "Manage photo competitions" },
	];
}
