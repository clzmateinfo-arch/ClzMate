import { ACCOUNT_TYPE } from '../../utils/constants';
import {
  VscDashboard,
} from "react-icons/vsc";
import { MdAssignmentTurnedIn } from "react-icons/md";

export const sidebarLinks = [
  {
    id: 100,
    name: "Overview",
    path: "/classroom/:classroomId/overview",
    type: ACCOUNT_TYPE.STUDENT,
    icon: VscDashboard,
  },
  {
    id: 101,
    name: "Classwork",
    path: "/classroom/:classroomId/classwork",
    type: ACCOUNT_TYPE.STUDENT,
    icon: MdAssignmentTurnedIn,
  },
  {
    id: 102,
    name: "Overview",
    path: "/classroom/:classroomId/overview",
    type: ACCOUNT_TYPE.INSTRUCTOR,
    icon: VscDashboard,
  },
  {
    id: 103,
    name: "Classwork",
    path: "/classroom/:classroomId/classwork",
    type: ACCOUNT_TYPE.INSTRUCTOR,
    icon: MdAssignmentTurnedIn,
  }
]
