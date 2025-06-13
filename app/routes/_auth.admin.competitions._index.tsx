import { Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function AdminCompetitionsPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Competition Management</h1>
					<p className="text-gray-600">Create and manage photo competitions</p>
				</div>
				<Button>
					<Plus className="h-4 w-4 mr-2" />
					New Competition
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Competitions</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-12 text-gray-500">
						<p>Competition management will be implemented in Phase 2</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export function meta() {
	return [
		{ title: "Competitions - Admin Dashboard" },
		{ name: "description", content: "Manage photo competitions" },
	];
}
