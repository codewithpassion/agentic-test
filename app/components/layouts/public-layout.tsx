import { Footer } from "~/components/shared/footer";
import { NavigationHeader } from "~/components/shared/navigation-header";

interface PublicLayoutProps {
	children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
	return (
		<div className="min-h-screen bg-white flex flex-col">
			<NavigationHeader />
			<div className="flex-grow">{children}</div>
			<Footer />
		</div>
	);
}
