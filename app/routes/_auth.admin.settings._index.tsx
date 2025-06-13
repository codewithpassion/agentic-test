import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function AdminSettingsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Settings</h1>
				<p className="text-gray-600">
					Configure system settings and preferences
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>System Settings</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-12 text-gray-500">
						<p>Settings interface will be implemented in a future phase</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export function meta() {
	return [
		{ title: "Settings - Admin Dashboard" },
		{ name: "description", content: "System settings and configuration" },
	];
}
