import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/entities/auth/model/authSlice";
import cartReducer from "@/entities/cart/model/cartSlice";
import courseReducer from "@/entities/course/model/courseSlice";
import profileReducer from "@/entities/user/model/userSlice";
import sidebarSlice from "@/entities/ui/sidebarSlice";
import classroomReducer from "@/entities/classroom/model/classroomSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  profile: profileReducer,
  course: courseReducer,
  cart: cartReducer,
  sidebar: sidebarSlice,
  classroom: classroomReducer,
});

export default rootReducer;
