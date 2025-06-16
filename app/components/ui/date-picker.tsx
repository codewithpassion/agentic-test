import React from "react";
import { cn } from "~/lib/utils";

interface DatePickerProps {
	value?: string;
	onChange: (value: string) => void;
	placeholder?: string;
	minDate?: string;
	maxDate?: string;
	disabled?: boolean;
	error?: string;
	label?: string;
	required?: boolean;
	id?: string;
	className?: string;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
	(
		{
			value,
			onChange,
			placeholder,
			minDate,
			maxDate,
			disabled = false,
			error,
			label,
			required = false,
			id,
			className,
			...props
		},
		ref
	) => {
		return (
			<div className="relative">
				{label && (
					<label
						htmlFor={id}
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						{label}
						{required && <span className="text-red-500 ml-1">*</span>}
					</label>
				)}
				<div className="relative">
					<input
						ref={ref}
						id={id}
						type="date"
						value={value || ""}
						onChange={(e) => onChange(e.target.value)}
						placeholder={placeholder}
						min={minDate}
						max={maxDate}
						disabled={disabled}
						required={required}
						className={cn(
							"flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
							"placeholder:text-gray-500",
							"focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
							"disabled:cursor-not-allowed disabled:opacity-50",
							"file:border-0 file:bg-transparent file:text-sm file:font-medium",
							error && "border-red-500 focus:ring-red-500 focus:border-red-500",
							className
						)}
						{...props}
					/>
				</div>
				{error && (
					<p className="text-red-500 text-sm mt-1">{error}</p>
				)}
			</div>
		);
	}
);

DatePicker.displayName = "DatePicker";