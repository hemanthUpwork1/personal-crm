import { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-green-500/15 border-green-500/25 text-green-400',
    error: 'bg-red-500/15 border-red-500/25 text-red-400',
  };

  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-6 z-[200] animate-slide-up">
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl
        shadow-lg ${styles[type]}
      `}>
        <Icon size={18} />
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="p-0.5 hover:opacity-70 transition-opacity">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
