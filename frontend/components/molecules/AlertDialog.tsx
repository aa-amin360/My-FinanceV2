import ModalOverlay from "@/frontend/components/molecules/ModalOverlay";

type AlertDialogProps = {
  title: string;
  message: string | null;
  onClose: () => void;
};

// Single-button dialog explaining why an action was refused
export default function AlertDialog({ title, message, onClose }: AlertDialogProps) {
  if (!message) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-white/75 dark:bg-black/60 border border-black/[0.05] dark:border-white/[0.05] text-black dark:text-white backdrop-blur-xl rounded-3xl p-6 w-full max-w-[320px] text-center shadow-2xl flex flex-col gap-4 animate-modalIn">
        <h3 className="text-lg font-bold mb-3 text-red-400">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">{message}</p>
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-sm transition active:scale-95 shadow-md shadow-green-500/10"
        >
          OK
        </button>
      </div>
    </ModalOverlay>
  );
}
