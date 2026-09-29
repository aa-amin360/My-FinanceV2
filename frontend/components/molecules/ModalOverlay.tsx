import type { ReactNode } from "react";

type ModalOverlayProps = {
  // Called when the dimmed backdrop itself is clicked; omit to make it inert
  onClose?: () => void;
  children: ReactNode;
};

// Full-screen dimmed, blurred backdrop that centers its content.
// Only clicks directly on the backdrop close it, never clicks inside the content.
export default function ModalOverlay({ onClose, children }: ModalOverlayProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (onClose && e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}
