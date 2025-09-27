import { ACCOUNT_TYPE } from '../../utils/constants'
import {
  VscAccount,
  VscDashboard,
  VscVm,
  VscAdd,
  VscMortarBoard,
  VscSettings,
} from "react-icons/vsc";
import { MdOutlinePendingActions ,MdAdminPanelSettings } from "react-icons/md";

export const sidebarLinks = [
  {
    id: 2,
    name: "Dashboard",
    path: "/dashboard/instructor",
    type: ACCOUNT_TYPE.INSTRUCTOR,
    icon: VscDashboard,
  }, {
    id: 2,
    name: "Dashboard",
    path: "/dashboard/student",
    type: ACCOUNT_TYPE.STUDENT,
    icon: VscDashboard,
  },
  {
    id: 3,
    name: "My Courses",
    path: "/dashboard/my-courses",
    type: ACCOUNT_TYPE.INSTRUCTOR,
    icon: VscVm,
  },
  {
    id: 9,
    name: "Pending Enrollments",
    path: "/dashboard/enrollments/pending",
    type: ACCOUNT_TYPE.STUDENT,
    icon: MdOutlinePendingActions,
  },
  {
    id: 4,
    name: "Add Course",
    path: "/dashboard/add-course",
    type: ACCOUNT_TYPE.INSTRUCTOR,
    icon: VscAdd,
  },
  {
    id: 5,
    name: "Enrolled Courses",
    path: "/dashboard/enrolled-courses",
    type: ACCOUNT_TYPE.STUDENT,
    icon: VscMortarBoard,
  },
  {
    id: 6,
    name: "Admin Controls",
    path: "/dashboard/admin-controls",
    type: ACCOUNT_TYPE.ADMIN,
    icon: MdAdminPanelSettings,
  },
  {
    id: 7,
    name: "My Profile",
    path: "/dashboard/my-profile",
    icon: VscAccount,
  },
  {
    id: 8,
    name: "Settings",
    path: "/dashboard/settings",
    icon: VscSettings,
  },
]
