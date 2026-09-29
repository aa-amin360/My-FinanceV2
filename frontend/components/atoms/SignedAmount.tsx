import { formatMoney } from "@/shared/config";
import { isInflowType } from "@/shared/ledger";

type SignedAmountProps = {
  type: string;
  amount: number | string;
  as?: "div" | "span";
  // Size/weight classes; the color comes from the transaction direction
  className?: string;
};

// "+1,500 Tk" in green for money coming in, "-1,500 Tk" in red for money going out
export default function SignedAmount({ type, amount, as: Tag = "div", className = "" }: SignedAmountProps) {
  const inflow = isInflowType(type);
  return (
    <Tag className={`${className} ${inflow ? "text-emerald-500" : "text-rose-500"}`}>
      {inflow ? "+" : "-"}
      {formatMoney(amount)}
    </Tag>
  );
}
