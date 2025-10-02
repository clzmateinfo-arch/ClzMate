// frontend/src/pages/main/Cart.jsx
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import RenderCartCourses from "@/features/cart/ui/RenderCartCourses";
import RenderTotalAmount from "@/features/cart/ui/RenderTotalAmount";
import { fetchCart } from "@/entities/cart/model/cartAPI";

export default function Cart() {
  const dispatch = useDispatch();
  const { total, totalItems } = useSelector((state) => state.cart);
  const { token } = useSelector((state) => state.auth || {});

  useEffect(() => {
    if (token) {
      dispatch(fetchCart(token));
    } else {
      // optional: if guest, attempt to use localStorage-based cart (already initialised)
    }
  }, [token, dispatch]);

  return (
    <>
      <h1 className="mb-14 text-3xl font-medium text-black text-center sm:text-left">Cart</h1>
      <p className="border-b border-b-black pb-2 font-semibold text-black">
        {totalItems} Courses in Cart
      </p>
      {total > 0 ? (
        <div className="mt-8 flex flex-col-reverse items-start gap-x-10 gap-y-6 lg:flex-row">
          <RenderCartCourses />
          <RenderTotalAmount />
        </div>
      ) : (
        <p className="mt-14 text-center text-3xl text-black">Your cart is empty</p>
      )}
    </>
  );
}
