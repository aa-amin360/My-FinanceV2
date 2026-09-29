// Pulsing red dot marking an overdue item
export default function OverdueDot({ title }: { title?: string }) {
  return <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" title={title} />;
}
