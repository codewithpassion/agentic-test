import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { trpc, trpcClient } from "~/lib/trpc";

interface TRPCProviderProps {
	children: React.ReactNode;
}

export function TRPCProvider({ children }: TRPCProviderProps) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 5 * 60 * 1000, // 5 minutes
						retry: (failureCount, error: unknown) => {
							// Don't retry on 4xx errors
							if (
								error?.data?.httpStatus >= 400 &&
								error?.data?.httpStatus < 500
							) {
								return false;
							}
							return failureCount < 3;
						},
					},
				},
			}),
	);

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				{children}
				<ReactQueryDevtools initialIsOpen={false} />
			</QueryClientProvider>
		</trpc.Provider>
	);
}
