export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

type BuildPaginationMetaInput = {
  page: number;
  limit: number;
  total: number;
};

function toPositiveInteger(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  const parsed = Math.trunc(value);
  return parsed > 0 ? parsed : fallback;
}

function toNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const parsed = Math.trunc(value);
  return parsed > 0 ? parsed : 0;
}

export function buildPaginationMeta({
  page,
  limit,
  total,
}: BuildPaginationMetaInput): PaginationMeta {
  const safeLimit = toPositiveInteger(limit, 20);
  const safeTotal = toNonNegativeInteger(total);
  const totalPages = safeTotal === 0 ? 0 : Math.ceil(safeTotal / safeLimit);
  const requestedPage = toPositiveInteger(page, 1);
  const safePage = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);

  return {
    page: safePage,
    limit: safeLimit,
    total: safeTotal,
    totalPages,
  };
}

export function paginateArray<T>(
  items: T[],
  page: number,
  limit: number,
): PaginatedResponse<T> {
  const meta = buildPaginationMeta({
    page,
    limit,
    total: items.length,
  });

  if (meta.total === 0) {
    return { data: [], meta };
  }

  const start = (meta.page - 1) * meta.limit;
  const end = start + meta.limit;

  return {
    data: items.slice(start, end),
    meta,
  };
}

export function getPaginationRange(meta: PaginationMeta): {
  from: number;
  to: number;
} {
  if (meta.total === 0) {
    return { from: 0, to: 0 };
  }

  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return { from, to };
}

