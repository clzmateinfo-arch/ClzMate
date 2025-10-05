import { ACCOUNT_TYPE } from '../../utils/constants'
import {
  VscDashboard,
  VscVm,
  VscMortarBoard,
} from "react-icons/vsc"

export const sidebarLinks = [
  {
    id: 1,
    name: "My Courses",
    path: "/dashboard/my-courses",
    type: ACCOUNT_TYPE.INSTRUCTOR,
    icon: VscVm,
  },
  {
    id: 2,
    name: "Enrolled Courses",
    path: "/dashboard/enrolled-courses",
    type: ACCOUNT_TYPE.STUDENT,
    icon: VscMortarBoard,
  }
]
