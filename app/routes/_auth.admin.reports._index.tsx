import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function AdminReportsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Reports</h1>
				<p className="text-gray-600">
					Review reported content and user reports
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Open Reports</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-12 text-gray-500">
						<p>Report management will be implemented in Phase 5</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export function meta() {
	return [
		{ title: "Reports - Admin Dashboard" },
		{ name: "description", content: "Review reported content" },
	];
}
