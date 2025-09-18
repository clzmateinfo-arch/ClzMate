import { ACCOUNT_TYPE } from '../../utils/constants'
import {
  VscAccount,
  VscDashboard,
  VscVm,
  VscAdd,
  VscMortarBoard,
  VscSettings
} from "react-icons/vsc"

export const sidebarLinks = [
  {
    id: 3,
    name: "My Courses",
    path: "/dashboard/my-courses",
    type: ACCOUNT_TYPE.INSTRUCTOR,
    icon: VscVm,
  },
  {
    id: 5,
    name: "Enrolled Courses",
    path: "/dashboard/enrolled-courses",
    type: ACCOUNT_TYPE.STUDENT,
    icon: VscMortarBoard,
  }
]
