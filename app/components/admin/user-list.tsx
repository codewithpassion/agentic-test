import { Plus, Search, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { useAuth } from "~/hooks/use-auth";
import { useUserStats, useUsers } from "~/hooks/use-user-management";
import type { UserRole } from "~/types/auth";

interface UserListProps {
	initialSearch?: string;
	initialRole?: UserRole;
}

export function UserList({ initialSearch = "", initialRole }: UserListProps) {
	const [search, setSearch] = useState(initialSearch);
	const [selectedRole, setSelectedRole] = useState<UserRole | "">(
		initialRole || "",
	);
	const [currentPage, setCurrentPage] = useState(0);
	const limit = 20;
	const { hasRole } = useAuth();

	const {
		data: usersData,
		isLoading,
		error,
	} = useUsers({
		search,
		role: selectedRole || undefined,
		limit,
		offset: currentPage * limit,
	});

	const { data: stats } = useUserStats();

	const handleSearchChange = (value: string) => {
		setSearch(value);
		setCurrentPage(0); // Reset to first page on search
	};

	const handleRoleFilter = (role: UserRole | "") => {
		setSelectedRole(role);
		setCurrentPage(0); // Reset to first page on filter
	};

	const getRoleBadge = (role: UserRole) => {
		switch (role) {
			case "superadmin":
				return <Badge variant="destructive">Super Admin</Badge>;
			case "admin":
				return <Badge variant="secondary">Admin</Badge>;
			case "user":
				return <Badge variant="outline">User</Badge>;
			default:
				return <Badge variant="outline">{role}</Badge>;
		}
	};

	const getStatusBadge = (emailVerified: boolean) => {
		return emailVerified ? (
			<Badge variant="active">Verified</Badge>
		) : (
			<Badge variant="inactive">Unverified</Badge>
		);
	};

	if (error) {
		return (
			<Card>
				<CardContent className="p-6">
					<div className="text-center text-red-600">
						<p>Failed to load users</p>
						<p className="text-sm text-gray-500 mt-1">{error.message}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Stats Cards */}
			{stats && (
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<Users className="h-8 w-8 text-blue-600" />
								<div>
									<p className="text-2xl font-bold">{stats.totalUsers}</p>
									<p className="text-sm text-gray-600">Total Users</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<UserPlus className="h-8 w-8 text-green-600" />
								<div>
									<p className="text-2xl font-bold">{stats.verifiedUsers}</p>
									<p className="text-sm text-gray-600">Verified</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<Users className="h-8 w-8 text-purple-600" />
								<div>
									<p className="text-2xl font-bold">{stats.totalAdmins}</p>
									<p className="text-sm text-gray-600">Admins</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<Users className="h-8 w-8 text-red-600" />
								<div>
									<p className="text-2xl font-bold">{stats.totalSuperAdmins}</p>
									<p className="text-sm text-gray-600">Super Admins</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Filters and Search */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>User Management</CardTitle>
						{hasRole("superadmin") && (
							<Link to="/admin/users/new">
								<Button>
									<Plus className="h-4 w-4 mr-2" />
									Create User
								</Button>
							</Link>
						)}
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						{/* Search */}
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
							<Input
								placeholder="Search by name or email..."
								value={search}
								onChange={(e) => handleSearchChange(e.target.value)}
								className="pl-10"
							/>
						</div>

						{/* Role Filter */}
						<select
							value={selectedRole}
							onChange={(e) =>
								handleRoleFilter(e.target.value as UserRole | "")
							}
							className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="">All Roles</option>
							<option value="user">Users</option>
							<option value="admin">Admins</option>
							<option value="superadmin">Super Admins</option>
						</select>
					</div>

					{/* User Table */}
					{isLoading ? (
						<div className="flex items-center justify-center h-32">
							<LoadingSpinner />
						</div>
					) : usersData?.users.length === 0 ? (
						<div className="text-center py-8">
							<Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
							<p className="text-gray-600">No users found</p>
							{search && (
								<p className="text-sm text-gray-500 mt-1">
									Try adjusting your search criteria
								</p>
							)}
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full border-collapse">
								<thead>
									<tr className="border-b border-gray-200">
										<th className="text-left py-3 px-4 font-medium text-gray-900">
											User
										</th>
										<th className="text-left py-3 px-4 font-medium text-gray-900">
											Role
										</th>
										<th className="text-left py-3 px-4 font-medium text-gray-900">
											Status
										</th>
										<th className="text-left py-3 px-4 font-medium text-gray-900">
											Joined
										</th>
										<th className="text-center py-3 px-4 font-medium text-gray-900">
											Actions
										</th>
									</tr>
								</thead>
								<tbody>
									{usersData?.users.map((user) => (
										<tr
											key={user.id}
											className="border-b border-gray-100 hover:bg-gray-50"
										>
											<td className="py-3 px-4">
												<div className="flex items-center gap-3">
													{user.image ? (
														<img
															src={user.image}
															alt={user.name}
															className="h-8 w-8 rounded-full"
														/>
													) : (
														<div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
															<span className="text-sm font-medium text-gray-600">
																{user.name.charAt(0).toUpperCase()}
															</span>
														</div>
													)}
													<div>
														<p className="font-medium text-gray-900">
															{user.name}
														</p>
														<p className="text-sm text-gray-500">
															{user.email}
														</p>
													</div>
												</div>
											</td>
											<td className="py-3 px-4">{getRoleBadge(user.roles)}</td>
											<td className="py-3 px-4">
												{getStatusBadge(user.emailVerified)}
											</td>
											<td className="py-3 px-4">
												<time className="text-sm text-gray-600">
													{new Date(user.createdAt).toLocaleDateString()}
												</time>
											</td>
											<td className="py-3 px-4 text-center">
												<Link to={`/admin/users/${user.id}/edit`}>
													<Button variant="outline" size="sm">
														Edit
													</Button>
												</Link>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}

					{/* Pagination */}
					{usersData && usersData.users.length > 0 && (
						<div className="flex items-center justify-between mt-6">
							<p className="text-sm text-gray-600">
								Showing {currentPage * limit + 1} to{" "}
								{Math.min((currentPage + 1) * limit, usersData.totalCount)} of{" "}
								{usersData.totalCount} users
							</p>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
									disabled={currentPage === 0}
								>
									Previous
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setCurrentPage(currentPage + 1)}
									disabled={!usersData.hasMore}
								>
									Next
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
