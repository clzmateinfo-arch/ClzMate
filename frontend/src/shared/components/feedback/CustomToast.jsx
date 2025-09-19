import { toast } from "react-hot-toast";
import {
    HiCheckCircle,
    HiXCircle,
    HiExclamationTriangle,
    HiInformationCircle,
} from "react-icons/hi2";

const variantStyles = {
    success: {
        icon: <HiCheckCircle className="text-purple-950 bg-green-500 rounded-full w-5 h-5" />,
        bg: "bg-gradient-to-t from-purple-950/95 to-violet-950/95",
        text: "text-white",
    },
    error: {
        icon: <HiXCircle className="text-purple-950 bg-red-500 rounded-full w-5 h-5" />,
        bg: "bg-gradient-to-t from-purple-950/95 to-violet-950/95",
        text: "text-white",
    },
    warning: {
        icon: <HiExclamationTriangle className="text-purple-950 bg-amber-500 rounded-full w-5 h-5" />,
        bg: "bg-gradient-to-t from-purple-950/95 to-violet-950/95",
        text: "text-white",
    },
    info: {
        icon: <HiInformationCircle className="text-purple-950 bg-blue-500 rounded-full w-5 h-5" />,
        bg: "bg-gradient-to-t from-purple-950/95 to-violet-950/95",
        text: "text-white",
    },
};

export const showToast = (message, type = "info", opts = {}) => {
    const styles = variantStyles[type] || variantStyles.info;

    toast.custom((t) => (
        <div
            className={`${t.visible ? "animate-custom-enter" : "animate-custom-leave"
                } max-w-sm w-full ${styles.bg} shadow-lg rounded-xl pointer-events-auto flex p-4 gap-3`}
        >
            <div className="flex-shrink-0">{styles.icon}</div>

            <div className="flex-1 text-sm font-medium leading-5">
                <p className={`${styles.text}`}>{message}</p>
            </div>

            <button
                onClick={() => toast.dismiss(t.id)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
                ✕
            </button>
        </div>
    ),
        {
            duration: 4500,
            ...opts,
        }
    );
};
