import { useInfiniteQuery } from "@tanstack/react-query";
import { server_activityPage } from "../../../server/tasks.server.js";

export function useActivity() {
  return useInfiniteQuery({
    queryKey: ["activity"],
    queryFn: ({ pageParam }) => server_activityPage({ cursor: pageParam, limit: 8 }),
    getNextPageParam: (last) => last.nextCursor,
    initialPageParam: 0,
  });
}
