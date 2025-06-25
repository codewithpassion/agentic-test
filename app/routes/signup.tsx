import { UserPlus } from "lucide-react";
import { Link } from "react-router";
import { PublicLayout } from "~/components/public-layout";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function SignUpPage() {
	return (
		<PublicLayout>
			<div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
				<Card className="w-full max-w-md">
					<CardHeader className="space-y-1">
						<CardTitle className="text-2xl font-bold text-center">
							Create an account
						</CardTitle>
						<CardDescription className="text-center">
							Enter your details to get started
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name">Full Name</Label>
								<Input id="name" type="text" placeholder="John Doe" required />
							</div>

							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									placeholder="name@example.com"
									required
								/>
							</div>

							<div className="flex items-center space-x-2">
								<Checkbox id="terms" />
								<label
									htmlFor="terms"
									className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									I agree with the{" "}
									<Link to="/tos" className="text-gray-900 underline">
										Terms
									</Link>{" "}
									and{" "}
									<Link to="/privacy" className="text-gray-900 underline">
										Privacy Policy
									</Link>
								</label>
							</div>

							<Button type="submit" className="w-full">
								<UserPlus className="w-4 h-4 mr-2" />
								Create Account
							</Button>
						</form>

						<div className="relative my-6">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-gray-300" />
							</div>
							<div className="relative flex justify-center text-sm">
								<span className="bg-white px-2 text-gray-500">Or</span>
							</div>
						</div>

						{/* Social login options */}
						<div className="space-y-3">
							<Button className="w-full" variant="outline">
								<svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
									<title>Google Icon</title>
									<path
										d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
										fill="currentColor"
									/>
								</svg>
								Sign Up with Google
							</Button>
						</div>

						<div className="text-center mt-6">
							<p className="text-sm text-gray-600">
								Already have an account?{" "}
								<Link
									to="/login"
									className="font-medium text-gray-900 hover:underline"
								>
									Sign in
								</Link>
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</PublicLayout>
	);
}
