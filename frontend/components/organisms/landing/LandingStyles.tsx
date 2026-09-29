// Keyframes and animation classes used only on the landing page
export default function LandingStyles() {
  return (
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(24px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes floatSlow {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-12px) rotate(0.3deg); }
      }
      @keyframes floatMedium {
        0%, 100% { transform: translateY(0px) rotate(1deg); }
        50% { transform: translateY(-15px) rotate(-1deg); }
      }
      @keyframes glowPulse {
        0%, 100% { box-shadow: 0 0 15px rgba(34, 197, 94, 0.08); }
        50% { box-shadow: 0 0 25px rgba(34, 197, 94, 0.18); }
      }
      @keyframes blobMove {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        50% { transform: translate(40px, -40px) scale(1.15); }
      }
      .animate-fade-in-up {
        animation: fadeInUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .animate-float-slow {
        animation: floatSlow 6s ease-in-out infinite;
      }
      .animate-float-medium {
        animation: floatMedium 8s ease-in-out infinite;
      }
      .animate-glow-pulse {
        animation: glowPulse 3s ease-in-out infinite;
      }
      .animate-blob-slow {
        animation: blobMove 15s ease-in-out infinite;
      }
    `}} />
  );
}
