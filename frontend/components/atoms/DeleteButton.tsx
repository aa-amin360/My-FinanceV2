import { Trash2 } from "lucide-react";

type DeleteButtonProps = {
  onClick: () => void;
  iconSize?: number;
  title?: string;
};

// Small red trash-can button used inside table rows
export default function DeleteButton({ onClick, iconSize = 15, title }: DeleteButtonProps) {
  return (
    <button
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="p-1.5 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition"
    >
      <Trash2 size={iconSize} />
    </button>
  );
}
