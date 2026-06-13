// frontend/src/entities/cart/model/cartAPI.ts
import { apiConnector } from "@/shared/services/api/apiConnector";
import { cartEndpoints } from "@/app/config/apis";
import { toast } from "react-hot-toast";
import { setCart } from "./cartSlice";

const { CART_API } = cartEndpoints;

export function fetchCart(token) {
    return async (dispatch) => {
        try {
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const resp = await apiConnector("GET", CART_API, null, headers);
            if (!resp?.data?.success) throw new Error(resp?.data?.message || "Failed to fetch cart");
            const { cart, total, totalItems } = resp.data.data;
            dispatch(setCart({ cart, total, totalItems }));
            return resp.data.data;
        } catch (err) {
            console.error("fetchCart error", err);
            toast.error(err?.message || "Could not fetch cart");
            return null;
        }
    };
}

export function addCourseToCart(token, course) {
    return async (dispatch) => {
        try {
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const resp = await apiConnector("POST", CART_API, { courseId: course._id }, headers);
            if (!resp?.data?.success) throw new Error(resp?.data?.message || "Failed to add to cart");
            const { cart, total, totalItems } = resp.data.data;
            dispatch(setCart({ cart, total, totalItems }));
            toast.success("Course added to cart");
            return resp.data.data;
        } catch (err) {
            console.error("addCourseToCart error", err);
            toast.error(err?.message || "Could not add to cart");
            return null;
        }
    };
}

export function removeCourseFromCart(token, courseId) {
    return async (dispatch) => {
        try {
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const resp = await apiConnector("DELETE", `${CART_API}/${courseId}`, null, headers);
            if (!resp?.data?.success) throw new Error(resp?.data?.message || "Failed to remove from cart");
            const { cart, total, totalItems } = resp.data.data;
            dispatch(setCart({ cart, total, totalItems }));
            toast.success("Course removed from cart");
            return resp.data.data;
        } catch (err) {
            console.error("removeCourseFromCart error", err);
            toast.error(err?.message || "Could not remove course from cart");
            return null;
        }
    };
}

export function clearCartServer(token) {
    return async (dispatch) => {
        try {
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const resp = await apiConnector("POST", `${CART_API}/clear`, null, headers);
            if (!resp?.data?.success) throw new Error(resp?.data?.message || "Failed to clear cart");
            dispatch(setCart({ cart: [], total: 0, totalItems: 0 }));
            toast.success("Cart cleared");
            return resp.data.data;
        } catch (err) {
            console.error("clearCartServer error", err);
            toast.error(err?.message || "Could not clear cart");
            return null;
        }
    };
}
