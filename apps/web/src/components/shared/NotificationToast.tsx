import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useNotificationStore } from '../../stores/notification.store';
import clsx from 'clsx';

const icons = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
};

export function NotificationToast() {
  const { notifications, remove } = useNotificationStore();

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80"
    >
      {notifications.map((n) => (
        <div
          key={n.id}
          role="alert"
          className={clsx(
            'flex items-start gap-3 p-4 rounded-xl shadow-lg border bg-white animate-in slide-in-from-right'
          )}
        >
          {icons[n.type]}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{n.title}</p>
            {n.message && <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>}
          </div>
          <button
            onClick={() => remove(n.id)}
            className="p-0.5 text-gray-400 hover:text-gray-600"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
