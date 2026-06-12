// frontend/src/entities/cart/model/cartSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-hot-toast";

const initialState = {
  cart: (() => { try { const c = localStorage.getItem("cart"); return c ? JSON.parse(c) : []; } catch { return []; } })(),
  total: (() => { try { const t = localStorage.getItem("total"); return t ? JSON.parse(t) : 0; } catch { return 0; } })(),
  totalItems: (() => { try { const t = localStorage.getItem("totalItems"); return t ? JSON.parse(t) : 0; } catch { return 0; } })(),
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // server will call this with populated data
    setCart: (state, action) => {
      const { cart = [], total = 0, totalItems = 0 } = action.payload || {};
      state.cart = cart;
      state.total = total;
      state.totalItems = totalItems;
      localStorage.setItem("cart", JSON.stringify(state.cart));
      localStorage.setItem("total", JSON.stringify(state.total));
      localStorage.setItem("totalItems", JSON.stringify(state.totalItems));
    },

    // Local fallback (kept for components that don't yet use server thunks)
    addToCartLocal: (state, action) => {
      const course = action.payload;
      const index = state.cart.findIndex((item) => item._id === course._id);
      if (index >= 0) {
        toast.error("Course already in cart");
        return;
      }
      state.cart.push(course);
      state.totalItems++;
      state.total += Number(course.price || 0);
      localStorage.setItem("cart", JSON.stringify(state.cart));
      localStorage.setItem("total", JSON.stringify(state.total));
      localStorage.setItem("totalItems", JSON.stringify(state.totalItems));
      toast.success("Course added to cart");
    },

    removeFromCartLocal: (state, action) => {
      const courseId = action.payload;
      const index = state.cart.findIndex((item) => item._id === courseId);
      if (index >= 0) {
        state.totalItems--;
        state.total -= Number(state.cart[index].price || 0);
        state.cart.splice(index, 1);
        localStorage.setItem("cart", JSON.stringify(state.cart));
        localStorage.setItem("total", JSON.stringify(state.total));
        localStorage.setItem("totalItems", JSON.stringify(state.totalItems));
        toast.success("Course removed from cart");
      }
    },

    resetCart: (state) => {
      state.cart = [];
      state.total = 0;
      state.totalItems = 0;
      localStorage.removeItem("cart");
      localStorage.removeItem("total");
      localStorage.removeItem("totalItems");
    },
  },
});

export const { setCart, addToCartLocal, removeFromCartLocal, resetCart } = cartSlice.actions;
export default cartSlice.reducer;
