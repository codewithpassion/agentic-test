import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";
import type { Competition } from "~/../../api/database/schema";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { DatePicker } from "~/components/ui/date-picker";
import { Input } from "~/components/ui/input";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { Textarea } from "~/components/ui/textarea";
import { trpc } from "~/lib/trpc";

const competitionFormSchema = z
	.object({
		title: z
			.string()
			.min(3, "Title must be at least 3 characters")
			.max(100, "Title must be less than 100 characters"),
		description: z
			.string()
			.min(20, "Description must be at least 10 characters")
			.max(2000, "Description must be less than 2000 characters"),
		startDate: z.string().optional(),
		endDate: z.string().optional(),
		status: z.enum(["draft", "active", "inactive", "completed"]),
	})
	.refine(
		(data) => {
			if (data.startDate && data.endDate) {
				return new Date(data.endDate) > new Date(data.startDate);
			}
			return true;
		},
		{
			message: "End date must be after start date",
			path: ["endDate"],
		},
	);

type CompetitionFormData = z.infer<typeof competitionFormSchema>;

interface CompetitionFormProps {
	competition?: Competition;
	mode: "create" | "edit";
}

export function CompetitionForm({ competition, mode }: CompetitionFormProps) {
	const navigate = useNavigate();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		setValue,
		watch,
		reset,
	} = useForm<CompetitionFormData>({
		resolver: zodResolver(competitionFormSchema),
		defaultValues: {
			title: competition?.title || "",
			description: competition?.description || "",
			startDate: competition?.startDate
				? new Date(competition.startDate).toISOString().split("T")[0]
				: "",
			endDate: competition?.endDate
				? new Date(competition.endDate).toISOString().split("T")[0]
				: "",
			status: competition?.status || "draft",
		},
	});

	const createMutation = trpc.competitions.create.useMutation({
		onSuccess: (data) => {
			navigate(`/admin/competitions/${data.id}`);
		},
		onError: (error) => {
			console.error("Failed to create competition:", error);
		},
	});

	const updateMutation = trpc.competitions.update.useMutation({
		onSuccess: (data) => {
			navigate(`/admin/competitions/${data.id}`);
		},
		onError: (error) => {
			console.error("Failed to update competition:", error);
		},
	});

	// Check if there's an active competition
	const { data: activeCompetition } = trpc.competitions.getActive.useQuery();

	const status = watch("status");

	// Auto-save draft functionality
	useEffect(() => {
		if (mode === "create") {
			const subscription = watch((value) => {
				const draftKey = "competition-draft";
				localStorage.setItem(draftKey, JSON.stringify(value));
			});
			return () => subscription.unsubscribe();
		}
	}, [watch, mode]);

	// Restore draft on mount
	useEffect(() => {
		if (mode === "create" && !competition) {
			const draftKey = "competition-draft";
			const draft = localStorage.getItem(draftKey);
			if (draft) {
				try {
					const parsedDraft = JSON.parse(draft);
					// Only restore if the draft has meaningful content (not just empty values)
					const hasContent =
						parsedDraft.title ||
						parsedDraft.description ||
						parsedDraft.startDate ||
						parsedDraft.endDate;
					if (hasContent) {
						// Ask user if they want to restore the draft
						const shouldRestore = confirm(
							"You have an unsaved draft. Would you like to restore it?",
						);
						if (shouldRestore) {
							reset(parsedDraft);
						} else {
							// Clear the draft if user doesn't want it
							localStorage.removeItem(draftKey);
						}
					}
				} catch (error) {
					console.error("Failed to restore draft:", error);
					// Clear corrupted draft
					localStorage.removeItem(draftKey);
				}
			}
		}
	}, [mode, competition, reset]);

	const onSubmit = async (data: CompetitionFormData) => {
		try {
			const submissionData = {
				title: data.title,
				description: data.description,
				startDate: data.startDate ? new Date(data.startDate) : undefined,
				endDate: data.endDate ? new Date(data.endDate) : undefined,
				status: data.status,
			};

			if (mode === "create") {
				await createMutation.mutateAsync(submissionData);
				// Clear draft after successful creation
				localStorage.removeItem("competition-draft");
			} else if (competition) {
				await updateMutation.mutateAsync({
					id: competition.id,
					data: submissionData,
				});
			}
		} catch (error) {
			// Error handling is done in mutation callbacks
		}
	};

	const getStatusBadge = (competitionStatus: string) => {
		switch (competitionStatus) {
			case "active":
				return <Badge variant="active">Active</Badge>;
			case "draft":
				return <Badge variant="draft">Draft</Badge>;
			case "completed":
				return <Badge variant="completed">Completed</Badge>;
			case "inactive":
				return <Badge variant="inactive">Inactive</Badge>;
			default:
				return <Badge variant="secondary">{competitionStatus}</Badge>;
		}
	};

	const canActivate =
		status === "active" &&
		(!activeCompetition || activeCompetition.id === competition?.id);
	const showActiveWarning =
		status === "active" &&
		activeCompetition &&
		activeCompetition.id !== competition?.id;

	return (
		<Card className="max-w-4xl mx-auto">
			<CardHeader>
				<CardTitle className="flex items-center gap-3">
					{mode === "create" ? "Create New Competition" : "Edit Competition"}
					{competition && getStatusBadge(competition.status)}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					{/* Title */}
					<div>
						<label
							htmlFor="title"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Title *
						</label>
						<Input
							id="title"
							{...register("title")}
							placeholder="Enter competition title..."
							className={errors.title ? "border-red-500" : ""}
						/>
						{errors.title && (
							<p className="text-red-500 text-sm mt-1">
								{errors.title.message}
							</p>
						)}
					</div>

					{/* Description */}
					<div>
						<label
							htmlFor="description"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Description *
						</label>
						<Textarea
							id="description"
							{...register("description")}
							placeholder="Describe the competition theme, rules, and requirements..."
							rows={4}
							className={errors.description ? "border-red-500" : ""}
						/>
						{errors.description && (
							<p className="text-red-500 text-sm mt-1">
								{errors.description.message}
							</p>
						)}
					</div>

					{/* Dates */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<DatePicker
							id="startDate"
							label="Start Date"
							value={watch("startDate")}
							onChange={(value) => setValue("startDate", value)}
							error={errors.startDate?.message}
							placeholder="Select start date"
						/>

						<DatePicker
							id="endDate"
							label="End Date"
							value={watch("endDate")}
							onChange={(value) => setValue("endDate", value)}
							error={errors.endDate?.message}
							placeholder="Select end date"
							minDate={watch("startDate") || undefined}
						/>
					</div>

					{/* Status */}
					<div>
						<label
							htmlFor="status"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Status *
						</label>
						<select
							id="status"
							{...register("status")}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="draft">Draft</option>
							<option
								value="active"
								disabled={!canActivate && status !== "active"}
							>
								Active
							</option>
							<option value="inactive">Inactive</option>
							<option value="completed">Completed</option>
						</select>
						{errors.status && (
							<p className="text-red-500 text-sm mt-1">
								{errors.status.message}
							</p>
						)}
						{showActiveWarning && (
							<p className="text-orange-600 text-sm mt-1">
								⚠️ Another competition is currently active. Activating this will
								deactivate the other.
							</p>
						)}
					</div>

					{/* Form Actions */}
					<div className="flex items-center justify-between pt-6 border-t">
						<Button
							type="button"
							variant="outline"
							onClick={() => navigate("/admin/competitions")}
						>
							Cancel
						</Button>
						<div className="flex items-center gap-3">
							{mode === "create" && (
								<>
									<Button
										type="button"
										variant="outline"
										onClick={() => {
											const draftKey = "competition-draft";
											localStorage.removeItem(draftKey);
											reset({
												title: "",
												description: "",
												startDate: "",
												endDate: "",
												status: "draft",
											});
										}}
										disabled={isSubmitting}
									>
										Clear Form
									</Button>
									<Button
										type="button"
										variant="outline"
										onClick={() => setValue("status", "draft")}
										disabled={isSubmitting}
									>
										Save as Draft
									</Button>
								</>
							)}
							<Button
								type="submit"
								disabled={
									isSubmitting ||
									createMutation.isPending ||
									updateMutation.isPending
								}
								className="min-w-24"
							>
								{isSubmitting ||
								createMutation.isPending ||
								updateMutation.isPending ? (
									<LoadingSpinner className="h-4 w-4" />
								) : mode === "create" ? (
									"Create Competition"
								) : (
									"Update Competition"
								)}
							</Button>
						</div>
					</div>

					{/* Error Messages */}
					{(createMutation.error || updateMutation.error) && (
						<div className="bg-red-50 border border-red-200 rounded-md p-4">
							<p className="text-red-600 text-sm">
								{createMutation.error?.message || updateMutation.error?.message}
							</p>
						</div>
					)}
				</form>
			</CardContent>
		</Card>
	);
}
