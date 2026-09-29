import type { Db } from "@/backend/db/pool";
import {
  countRootTransactions,
  listChildTransactions,
  listRootTransactions,
  TransactionFilters,
} from "@/backend/repositories/transactions";
import { MAX_ALL_ROWS } from "@/backend/validators/transactions";
import { isUserLinkedChild } from "@/shared/ledger";

type ListOptions = {
  all: boolean;
  page: number;
  limit: number;
  filters: TransactionFilters;
};

// Top-level transactions (paginated unless `all`) followed by their children.
// Each row gets `has_child`, and children get `is_linked` when they are a
// user-entered repayment that can be deleted on its own.
export async function listTransactions(db: Db, userId: string, { all, page, limit, filters }: ListOptions) {
  const total = await countRootTransactions(db, userId, filters);
  const roots = await listRootTransactions(db, userId, filters, {
    limit: all ? MAX_ALL_ROWS : limit,
    offset: all ? 0 : (page - 1) * limit,
  });
  const children = await listChildTransactions(
    db,
    userId,
    roots.map((root) => root.id)
  );

  const rootTypes = new Map<number, string>(roots.map((root) => [root.id, root.type]));
  const parentsWithChildren = new Set(children.map((child) => child.parent_id));

  const data = [
    ...roots.map((root) => ({ ...root, has_child: parentsWithChildren.has(root.id), is_linked: false })),
    ...children.map((child) => ({
      ...child,
      has_child: false,
      is_linked: isUserLinkedChild(child.type, rootTypes.get(child.parent_id) ?? ""),
    })),
  ];

  return {
    data,
    pagination: {
      total,
      page: all ? 1 : page,
      limit: all ? total : limit,
      totalPages: all ? 1 : Math.max(1, Math.ceil(total / limit)),
    },
  };
}
