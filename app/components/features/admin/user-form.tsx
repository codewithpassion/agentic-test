import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface UserFormProps {
	mode: "edit";
}

export function UserForm({ mode }: UserFormProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>User Management</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground">
					User management is handled through the Clerk dashboard. Please visit
					your Clerk dashboard to manage users, roles, and permissions.
				</p>
			</CardContent>
		</Card>
	);
}
