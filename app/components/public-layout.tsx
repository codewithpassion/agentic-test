import { Footer } from "~/components/footer";
import { NavigationHeader } from "~/components/navigation-header";

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
