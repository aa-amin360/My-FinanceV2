// Inline form error; renders nothing when there is no message
export default function ErrorText({ message }: { message?: string | null }) {
  if (!message) return null;
  return <div className="text-xs text-red-500 font-bold leading-normal">{message}</div>;
}
