import { Camera } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "~/hooks/use-auth";
import { Button } from "./button";

interface SubmitPhotoCTAProps {
	competitionId: string;
	categoryName?: string;
	title?: string;
	description?: string;
	className?: string;
	buttonSize?: "default" | "sm" | "lg";
}

export function SubmitPhotoCTA({
	competitionId,
	categoryName,
	title = "Ready to share your photography?",
	description,
	className = "",
	buttonSize = "lg",
}: SubmitPhotoCTAProps) {
	const { user } = useAuth();

	const defaultDescription = categoryName
		? `Join the competition and submit your own photos to the ${categoryName} category.`
		: "Join the competition and submit your best shots to showcase your talent.";

	return (
		<div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
			<h3 className="text-xl font-medium text-gray-900 mb-2">{title}</h3>
			<p className="text-gray-600 mb-6">{description || defaultDescription}</p>
			<Link to={user ? `/submit/${competitionId}` : "/login"}>
				<Button size={buttonSize}>
					<Camera className="w-5 h-5 mr-2" />
					Submit Your Photo
				</Button>
			</Link>
		</div>
	);
}