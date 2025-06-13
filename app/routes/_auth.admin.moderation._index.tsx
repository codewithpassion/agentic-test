import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function AdminModerationPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Photo Moderation</h1>
				<p className="text-gray-600">Review and moderate photo submissions</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Moderation Queue</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-12 text-gray-500">
						<p>Photo moderation will be implemented in Phase 5</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export function meta() {
	return [
		{ title: "Photo Moderation - Admin Dashboard" },
		{ name: "description", content: "Moderate photo submissions" },
	];
}
