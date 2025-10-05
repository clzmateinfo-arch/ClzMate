import { ACCOUNT_TYPE } from '../../utils/constants'
import {
  VscAccount,
  VscDashboard,
  VscVm,
  VscAdd,
  VscMortarBoard,
  VscSettings,
} from "react-icons/vsc";
import { MdOutlinePendingActions, MdAdminPanelSettings } from "react-icons/md";
import { BiCategoryAlt } from "react-icons/bi";
import { SiGoogleclassroom } from "react-icons/si";

export const sidebarLinks = [
  {
    id: 301,
    name: "Dashboard",
    path: "/dashboard/instructor",
    type: ACCOUNT_TYPE.INSTRUCTOR,
    icon: VscDashboard,
  }, {
    id: 302,
    name: "Dashboard",
    path: "/dashboard/student",
    type: ACCOUNT_TYPE.STUDENT,
    icon: VscDashboard,
  },
  {
    id: 303,
    name: "My Courses",
    path: "/dashboard/my-courses",
    type: ACCOUNT_TYPE.INSTRUCTOR,
    icon: VscVm,
  },
  {
    id: 304,
    name: "Pending Enrollments",
    path: "/dashboard/enrollments/pending",
    type: ACCOUNT_TYPE.STUDENT,
    icon: MdOutlinePendingActions,
  },
  {
    id: 305,
    name: "Add Course",
    path: "/dashboard/add-course",
    type: ACCOUNT_TYPE.INSTRUCTOR,
    icon: VscAdd,
  },
  {
    id: 306,
    name: "Enrolled Courses",
    path: "/dashboard/enrolled-courses",
    type: ACCOUNT_TYPE.STUDENT,
    icon: VscMortarBoard,
  },
  {
    id: 307,
    name: "Classrooms",
    path: "/dashboard/classrooms",
    type: ACCOUNT_TYPE.INSTRUCTOR,
    icon: SiGoogleclassroom,
  },
  {
    id: 308,
    name: "My Classroom",
    path: "/dashboard/my-classrooms",
    type: ACCOUNT_TYPE.STUDENT,
    icon: SiGoogleclassroom,
  },
  {
    id: 309,
    name: "Users",
    path: "/dashboard/admin-controls/users",
    type: ACCOUNT_TYPE.ADMIN,
    icon: MdAdminPanelSettings,
  },
  {
    id: 310,
    name: "Categories",
    path: "/dashboard/admin-controls/categories",
    type: ACCOUNT_TYPE.ADMIN,
    icon: BiCategoryAlt,
  },
  {
    id: 311,
    name: "My Profile",
    path: "/dashboard/my-profile",
    icon: VscAccount,
  },
  {
    id: 312,
    name: "Settings",
    path: "/dashboard/settings",
    icon: VscSettings,
  },
]
