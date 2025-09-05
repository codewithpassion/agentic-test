import { SignUp } from "@clerk/react-router";

export default function SignUpPage() {
	return (
		<div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
			<SignUp
				routing="path"
				path="/sign-up"
				signInUrl="/login"
				afterSignUpUrl="/todos"
				appearance={{
					elements: {
						card: "shadow-none",
						rootBox: "w-full max-w-md",
					},
				}}
			/>
		</div>
	);
}
