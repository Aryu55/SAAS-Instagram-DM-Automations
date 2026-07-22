import { getAllAutomation, getAutomationInfo } from "@/actions/automation";
import { onUserInfo } from "@/actions/user";
import { QueryClient, QueryFunction } from "@tanstack/react-query";

const prefetch = async (
  client: QueryClient,
  action: QueryFunction,
  key: string
) => {
  return await client.prefetchQuery({
    queryKey: [key],
    queryFn: action,
    staleTime: 60000,
  });
};

export const PrefetchUserProfile = async (client: QueryClient) => {
  return await prefetch(client, onUserInfo, "user-profile");
};

export const PrefetchUserAutomation = async (client: QueryClient, slug?: string) => {
  return await client.prefetchQuery({
    queryKey: ["user-automation", slug],
    queryFn: () => getAllAutomation(slug),
    staleTime: 60000,
  });
};

export const PrefetchUserAutomations = async (
  client: QueryClient,
  automationId: string
) => {
  return await client.prefetchQuery({
    queryKey: ["automation-info", automationId],
    queryFn: () => getAutomationInfo(automationId),
    staleTime: 60000,
  });
};
