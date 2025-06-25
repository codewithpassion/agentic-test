import type { MetaFunction } from "react-router";
import { Link } from "react-router";
import bird from "~/assets/barb-wolfe.png";
import footer from "~/assets/claudia-uloa.png";
import { PublicLayout } from "~/components/public-layout";
import { Button } from "~/components/ui/button";

export const meta: MetaFunction = () => {
	return [
		{ title: "About - 2025 Wildlife Photo Contest" },
		{
			name: "description",
			content:
				"Learn about the 73rd annual International Conference of the Wildlife Disease Association's Wildlife Photo Contest.",
		},
	];
};

export default function AboutPage() {
	return (
		<PublicLayout>
			{/* Main Content */}
			<div className="flex flex-col lg:flex-row">
				{/* Left Content */}
				<div className="flex-1 px-8 lg:px-16 py-12 lg:py-16">
					{/* Title */}
					<h1 className="text-5xl font-bold mb-12">ABOUT</h1>

					{/* Introduction */}
					<div className="mb-16">
						<p className="text-gray-700 mb-6 leading-relaxed">
							The 73rd annual International Conference of the Wildlife Disease
							Association's Wildlife Photo Contest is an event for participants
							to indulge and showcase photography representing photographs. As
							part of the conference, we are excited to invite photographers
							from all levels of expertise to participate and share their unique
							imagery of wildlife photography.
						</p>
						<p className="text-gray-700 leading-relaxed">
							The Wildlife Photo Contest is an effort by the Wildlife Disease
							Association (WDA) in collaboration with the local conference
							committee.
						</p>
					</div>

					{/* Entry Fees */}
					<div className="mb-16">
						<h2 className="text-2xl font-bold mb-4">Entry fees</h2>
						<p className="text-gray-700 mb-2">
							Regular members
							<br />
							$5 USD for 1 photo ($7 each if submitting &gt;1 photo)
						</p>
						<p className="text-gray-700 mb-2">
							Student members
							<br />
							$5 USD for 1 photo ($5 each if submitting &gt;1 photo)
						</p>
						<p className="text-sm text-gray-600 italic">
							All proceeds from entry fees go to student activities.
						</p>
					</div>

					{/* Contest Description */}
					<p className="text-gray-700 mb-12 leading-relaxed">
						Our contest aims to highlight the importance of wildlife
						conservation and raise awareness about the serious challenges faced
						by wildlife around the world, along with the incredible opportunity
						to share your visual stories and make a difference in the society of
						wildlife health.
					</p>

					{/* Buttons */}
					<div className="flex gap-4 mb-16">
						<Button asChild className="bg-gray-900 hover:bg-gray-800">
							<Link to="/signup">Register Now</Link>
						</Button>
						<Button
							asChild
							variant="outline"
							className="border-gray-900 text-gray-900 hover:bg-gray-100"
						>
							<Link to="/login">Vote Now</Link>
						</Button>
					</div>

					{/* Overview */}
					<div className="mb-16">
						<h2 className="text-3xl font-bold mb-6">Overview</h2>
						<p className="text-gray-700 mb-4">
							Anyone attending the conference in person and remotely is eligible
							to participate in the photo contest.
						</p>
						<p className="text-gray-700 mb-6">
							A maximum of 5 photos per individual can be submitted. Photos can
							be submitted to either one or all categories.
						</p>
						<p className="text-gray-700 font-semibold mb-4">
							Entrants must have taken the photo(s) and have all rights to its
							distribution and use.
						</p>
						<div>
							<p className="text-gray-700 font-semibold mb-2">Categories:</p>
							<ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4">
								<li>Wildlife – free ranging</li>
								<li>Wildlife – captive or at the urban interface</li>
								<li>Landscapes/Flora – can either contain animals or not</li>
							</ol>
						</div>
					</div>
				</div>

				{/* Right Image */}
				<div className="lg:w-[500px] xl:w-[600px] lg:sticky lg:top-0 lg:h-screen relative">
					<img
						src={bird}
						alt="Credits: Barb Wolfe"
						className="w-full h-full object-cover"
					/>
					<div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white px-4 py-2">
						<p className="text-sm">© 2025 Barb Wolfe. All rights reserved.</p>
					</div>
				</div>
			</div>

			{/* Instructions Section - Grey Background */}
			<div className="bg-gray-100 px-8 lg:px-16 py-12 lg:py-16">
				<h2 className="text-3xl font-bold mb-8">Instructions and Formatting</h2>
				<p className="text-gray-700 mb-8">
					Please consider these six suggested guidelines. For any specific
					questions, feel free to contact Fernanda Malraux at{" "}
					<a
						href="mailto:fernanda.malerux@ucanl.org"
						className="text-blue-600 hover:underline"
					>
						fernanda.malerux@ucanl.org
					</a>{" "}
					with the subject line "WDA Photo Contest 2025."
				</p>

				<div className="space-y-8">
					<div>
						<h3 className="text-xl font-bold mb-3">Formatting:</h3>
						<ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
							<li>Accepted formats: JPEG or PNG</li>
							<li>Minimum resolution: 3000 pixels on the longest side</li>
							<li>Maximum file size: 16 MB</li>
							<li>
								Basic adjustments (contrast, brightness, and cropping are
								allowed)
							</li>
							<li>
								Excessive alterations (compositing, AI generated elements, or
								heavy retouching) are not permitted
							</li>
							<li>Watermarks, signatures, or borders should not be added</li>
						</ul>
					</div>

					<div>
						<h3 className="text-xl font-bold mb-3">Copyright and Usage</h3>
						<ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
							<li>Participants retain full copyright over their images</li>
							<li>
								By submitting, you grant the contest organizers (WDA Student
								Activities Committee) permission to use the images for
								promotional purposes with full credit to the photographers and
								your authorisation from them
							</li>
						</ul>
					</div>

					<div>
						<h3 className="text-xl font-bold mb-3">Photo Evaluation</h3>
						<p className="text-gray-700 ml-4">
							The contest will be judged by an elite group of WDA members. There
							is also a "popular vote" by conference attendees. Images will have
							their authorship masked during voting. Winners, runners-up
							assessments, and "wow factor."
						</p>
					</div>

					<div>
						<h3 className="text-xl font-bold mb-3">Prize</h3>
						<p className="text-gray-700 ml-4">
							We always have an amazing prize and this year will be no
							different... it will be announced soon!
						</p>
					</div>

					<div>
						<h3 className="text-xl font-bold mb-3">Deadline and results</h3>
						<ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
							<li>
								Deadline to submit your photo is Wednesday, July 30th, at 11:59
								PM (MDT).
							</li>
							<li>
								Results will be announced during the banquet on July 31st.
							</li>
						</ul>
					</div>
				</div>
			</div>

			{/* Bottom Image */}
			<div className="w-full h-[400px] relative">
				<img
					src={footer}
					alt="credits: Claudia Ulloa"
					className="w-full h-full object-cover"
				/>
				<div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white px-8 py-4">
					<p className="text-sm">© 2025 Claudia Ulloa. All rights reserved.</p>
				</div>
			</div>
		</PublicLayout>
	);
}
