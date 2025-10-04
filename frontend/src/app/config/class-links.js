import { ACCOUNT_TYPE } from '../../utils/constants'
import {
  VscDashboard,
  VscVm,
  VscMortarBoard,
} from "react-icons/vsc"

export const sidebarLinks = [
  {
    id: 1,
    name: "Overview",
    path: "/classroom/:classroomId/overview",
    type: ACCOUNT_TYPE.STUDENT,
    icon: VscDashboard,
  },
  {
    id: 2,
    name: "Classwork",
    path: "/classroom/:classroomId/classwork",
    type: ACCOUNT_TYPE.STUDENT,
    icon: VscMortarBoard,
  },
  {
    id: 1,
    name: "Overview",
    path: "/classroom/:classroomId/overview",
    type: ACCOUNT_TYPE.INSTRUCTOR,
    icon: VscDashboard,
  },
  {
    id: 2,
    name: "Classwork",
    path: "/classroom/:classroomId/classwork",
    type: ACCOUNT_TYPE.INSTRUCTOR,
    icon: VscMortarBoard,
  }
]
