import type { JsonBody } from "@/backend/http/request";
import { SPENDABLE_ACCOUNTS, SpendableAccount } from "@/shared/config";
import { TRANSFER_DIRECTIONS, TransferDirection, TX_TYPES, TYPE_META, TxType } from "@/shared/transactionTypes";
import {
  isValidDateString,
  parseAmount,
  parseDate,
  parseEnum,
  parseId,
  parseOptionalId,
  parseText,
} from "@/backend/validators/common";

export type CreateTransactionInput = {
  type: TxType;
  amount: number;
  account: SpendableAccount;
  date: string;
  note: string | null;
  direction: TransferDirection | null;
  entity: string | null;
  categoryId: number | null;
  savingsGoalId: number | null;
};

export function parseCreateTransaction(body: JsonBody): CreateTransactionInput {
  const type = parseEnum(body.type, TX_TYPES, "Transaction type");
  const { group } = TYPE_META[type];

  return {
    type,
    amount: parseAmount(body.amount),
    account: parseEnum(body.account, SPENDABLE_ACCOUNTS, "Account"),
    date: parseDate(body.date),
    note: parseText(body.note, "Note", { max: 500, required: false }),
    direction: type === "TRANSFER" ? parseEnum(body.direction, TRANSFER_DIRECTIONS, "Direction") : null,
    entity: group === "BALANCE" ? null : parseText(body.entity, "Counterparty", { max: 100 }),
    categoryId: type === "INCOME" || type === "EXPENSE" ? parseOptionalId(body.category_id, "Category") : null,
    savingsGoalId: type === "TRANSFER" ? parseOptionalId(body.savings_goal_id, "Savings goal") : null,
  };
}

export const MAX_PAGE_SIZE = 100;
export const MAX_ALL_ROWS = 20000;

// Query params for GET /api/transactions. Unknown or malformed filters are ignored,
// except type/entityId which are rejected so typos don't silently return everything.
export function parseTransactionListQuery(params: URLSearchParams) {
  const all = params.get("all") === "true";
  const page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(params.get("limit") || "20", 10) || 20));
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");
  const type = params.get("type");
  const entityId = params.get("entityId");

  return {
    all,
    page,
    limit,
    filters: {
      search: params.get("search")?.trim() || null,
      startDate: isValidDateString(startDate) ? startDate : null,
      endDate: isValidDateString(endDate) ? endDate : null,
      type: type ? parseEnum(type, TX_TYPES, "Type") : null,
      entityId: entityId ? parseId(entityId, "Counterparty") : null,
    },
  };
}

export function parseTransactionId(value: unknown) {
  return parseId(value, "Transaction");
}
