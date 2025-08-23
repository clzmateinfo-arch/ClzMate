import { toast } from "react-hot-toast";

const variantStyles = {
    success: {
        icon: <p></p>,
        bg: "bg-green-50 border-green-400",
        text: "text-green-800",
    },
    error: {
        icon: <p></p>,
        bg: "bg-red-50 border-red-400",
        text: "text-red-800",
    },
    warning: {
        icon: <p></p>,
        bg: "bg-yellow-50 border-yellow-400",
        text: "text-yellow-800",
    },
    info: {
        icon: <p></p>,
        bg: "bg-blue-50 border-blue-400",
        text: "text-blue-800",
    },
};

export const showToast = (message, type = "info") => {
    const styles = variantStyles[type] || variantStyles.info;

    toast.custom((t) => (
        <div
            className={`${t.visible ? "animate-custom-enter" : "animate-custom-leave"
                } max-w-sm w-full ${styles.bg} border shadow-lg rounded-xl pointer-events-auto flex p-4 gap-3`}
        >
            {/* Icon */}
            <div className="flex-shrink-0">{styles.icon}</div>

            {/* Message */}
            <div className="flex-1 text-sm font-medium leading-5">
                <p className={`${styles.text}`}>{message}</p>
            </div>

            {/* Close Button */}
            <button
                onClick={() => toast.dismiss(t.id)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
                ✕
            </button>
        </div>
    ));
};
