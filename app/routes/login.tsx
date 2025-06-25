import {
	type ActionFunctionArgs,
	type AppLoadContext,
	Outlet,
} from "react-router";
import { PublicLayout } from "~/components/public-layout";

export async function action({
	request,
	context,
	params,
}: ActionFunctionArgs<AppLoadContext>) {}

export default function Login() {
	return (
		<PublicLayout>
			<Outlet />
		</PublicLayout>
	);
}
