import { useMutation } from "convex/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { DatePicker } from "~/components/ui/date-picker";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { api } from "../../../../convex/_generated/api";

export const WorklogForm = () => {
	// Get today's date in YYYY-MM-DD format
	const today = new Date().toISOString().split("T")[0];

	const [date, setDate] = useState(today);
	const [workedHours, setWorkedHours] = useState("");
	const [taskId, setTaskId] = useState("");
	const [description, setDescription] = useState("");
	const [isCreating, setIsCreating] = useState(false);

	const createWorklog = useMutation(api.worklogs.createWorklog);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const hours = Number.parseFloat(workedHours);

		// Validation
		if (!date) {
			toast.error("Please select a date");
			return;
		}

		if (!workedHours || hours <= 0) {
			toast.error("Please enter valid worked hours (greater than 0)");
			return;
		}

		setIsCreating(true);
		try {
			await createWorklog({
				date,
				workedHours: hours,
				taskId: taskId.trim() || undefined,
				description: description.trim() || undefined,
			});

			// Reset form
			setDate(today);
			setWorkedHours("");
			setTaskId("");
			setDescription("");

			toast.success("Worklog entry created successfully!");
		} catch (error) {
			console.error("Failed to create worklog:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to create worklog entry",
			);
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Date Field */}
				<div>
					<DatePicker
						id="worklog-date"
						label="Date"
						value={date}
						onChange={setDate}
						disabled={isCreating}
						required
						maxDate={today}
					/>
				</div>

				{/* Hours Field */}
				<div>
					<Label htmlFor="worklog-hours">
						Hours Worked
						<span className="text-red-500 ml-1">*</span>
					</Label>
					<Input
						id="worklog-hours"
						type="number"
						step="0.1"
						min="0.1"
						value={workedHours}
						onChange={(e) => setWorkedHours(e.target.value)}
						placeholder="e.g., 7.5"
						disabled={isCreating}
						required
						className="mt-1"
					/>
					<p className="text-xs text-gray-500 mt-1">
						Enter hours as decimal (e.g., 7.5 for 7 hours 30 minutes)
					</p>
				</div>
			</div>

			{/* Task ID Field (Optional) */}
			<div>
				<Label htmlFor="worklog-task-id">Task ID (Optional)</Label>
				<Input
					id="worklog-task-id"
					type="text"
					value={taskId}
					onChange={(e) => setTaskId(e.target.value)}
					placeholder="e.g., TASK-123"
					disabled={isCreating}
					className="mt-1"
				/>
			</div>

			{/* Description Field (Optional) */}
			<div>
				<Label htmlFor="worklog-description">Description (Optional)</Label>
				<Textarea
					id="worklog-description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="What did you work on?"
					disabled={isCreating}
					rows={3}
					className="mt-1"
				/>
			</div>

			{/* Submit Button */}
			<div className="flex justify-end">
				<Button
					type="submit"
					disabled={!date || !workedHours || isCreating}
					className="gap-2"
				>
					<Plus className="h-4 w-4" />
					{isCreating ? "Adding..." : "Add Worklog Entry"}
				</Button>
			</div>
		</form>
	);
};
