import { ACCOUNT_TYPE } from '../../utils/constants';
import {
  VscDashboard,
} from "react-icons/vsc";
import { MdAssignmentTurnedIn } from "react-icons/md";

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
    icon: MdAssignmentTurnedIn,
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
    icon: MdAssignmentTurnedIn,
  }
]
