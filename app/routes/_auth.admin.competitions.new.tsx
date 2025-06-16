import { CompetitionForm } from "~/components/admin/competition-form";

export default function NewCompetitionPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Create New Competition</h1>
				<p className="text-gray-600">
					Set up a new photo competition with categories and rules
				</p>
			</div>

			<CompetitionForm mode="create" />
		</div>
	);
}

export function meta() {
	return [
		{ title: "New Competition - Admin Dashboard" },
		{ name: "description", content: "Create a new photo competition" },
	];
}
