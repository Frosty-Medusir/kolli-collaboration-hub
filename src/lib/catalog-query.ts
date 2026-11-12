import { queryOptions } from "@tanstack/react-query";
import { getCatalog } from "./catalog.functions";
import type { TypeFilter } from "./titles";
export const catalogOptions = (query = "", type: TypeFilter = "both") => queryOptions({ queryKey: ["catalog", query, type], queryFn: () => getCatalog({ data: { query, type } }), staleTime: 300000 });