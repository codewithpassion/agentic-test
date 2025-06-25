import { PublicLayout } from "~/components/public-layout";
import { Welcome } from "../welcome/welcome";
import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "New React Router App" },
		{ name: "description", content: "Welcome to React Router!" },
	];
}

export function loader({ context }: Route.LoaderArgs) {
	return { message: "Welcome to the Home Page!" };
}

export default function Home({ loaderData }: Route.ComponentProps) {
	return (
		<PublicLayout>
			<Welcome message={loaderData.message} />
		</PublicLayout>
	);
}
