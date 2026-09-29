import type { ReactNode } from "react";
import Heading from "@/frontend/components/atoms/Heading";
import Subtitle from "@/frontend/components/atoms/Subtitle";

// Page title with a short description underneath
export default function PageHeader({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div>
      <Heading>{title}</Heading>
      {subtitle && <Subtitle>{subtitle}</Subtitle>}
    </div>
  );
}
