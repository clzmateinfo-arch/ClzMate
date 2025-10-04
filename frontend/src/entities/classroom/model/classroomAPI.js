import { apiConnector } from "@/shared/services/api/apiConnector";
import { toast } from "react-hot-toast";
import { classroomEndpoints } from "@/app/config/apis";

const {
    CREATE_CLASSROOM_API,
    GET_MY_CLASSROOMS_API,
    JOIN_CLASSROOM_API,
    GET_CLASS_OVERVIEW_API,
    CREATE_ANNOUNCEMENT_API,
    LIST_ANNOUNCEMENTS_API,
    CREATE_TOPIC_API,
    LIST_TOPICS_API,
    CREATE_ASSIGNMENT_API,
    LIST_ASSIGNMENTS_BY_TOPIC_API,
    SUBMIT_ASSIGNMENT_API,
    GET_SUBMISSIONS_API,
    GRADE_SUBMISSION_API,
} = classroomEndpoints || {};

export async function createClassroomAPI(payload, token) {
    try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await apiConnector("POST", CREATE_CLASSROOM_API, payload, headers);
        if (!response?.data?.success) {
            throw new Error(response?.data?.message || "Failed to create classroom");
        }
        toast.success(response?.data?.message || "Classroom created");
        return response.data.data;
    } catch (err) {
        console.error("createClassroomAPI error", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to create classroom");
        throw err;
    }
}

export async function fetchMyClassroomsAPI(token, options = {}) {
    try {
        const { type = "all", page = 1, limit = 6, search = "" } = options || {};
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const params = new URLSearchParams();
        if (type) params.append("type", type);
        if (page) params.append("page", String(page));
        if (limit) params.append("limit", String(limit));
        if (search) params.append("search", String(search));

        const url = `${GET_MY_CLASSROOMS_API}?${params.toString()}`;
        const response = await apiConnector("GET", url, null, headers);
        if (!response?.data?.success) {
            throw new Error(response?.data?.message || "Failed to fetch classrooms");
        }
        return response.data;
    } catch (err) {
        console.error("fetchMyClassroomsAPI error", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to load classrooms");
        throw err;
    }
}

export async function joinClassroomByCodeAPI(payload, token) {
    try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await apiConnector("POST", JOIN_CLASSROOM_API, payload, headers);
        if (!response?.data?.success) {
            throw new Error(response?.data?.message || "Failed to join classroom");
        }
        toast.success(response?.data?.message || "Joined classroom");
        return response.data.data;
    } catch (err) {
        console.error("joinClassroomByCodeAPI error", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to join classroom");
        throw err;
    }
}

export async function fetchClassOverviewAPI(classroomId, token) {
    console.log("fetchClassOverviewAPI", classroomId, token);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiConnector("GET", `${GET_CLASS_OVERVIEW_API}/${classroomId}/overview`, null, headers);
    if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
    return response.data.data;
}

export async function createAnnouncementAPI(classroomId, payload, token) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiConnector("POST", `${CREATE_ANNOUNCEMENT_API}/${classroomId}/announcements`, payload, headers);
    if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
    return response.data.data;
}

export async function listAnnouncementsAPI(classroomId, token) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiConnector("GET", `${LIST_ANNOUNCEMENTS_API}/${classroomId}/announcements`, null, headers);
    if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
    return response.data.data;
}

export async function createTopicAPI(classroomId, payload, token) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiConnector("POST", `${CREATE_TOPIC_API}/${classroomId}/topics`, payload, headers);
    if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
    return response.data.data;
}

export async function listTopicsAPI(classroomId, token) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiConnector("GET", `${LIST_TOPICS_API}/${classroomId}/topics`, null, headers);
    if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
    return response.data.data;
}

export async function createAssignmentAPI(topicId, payload, token) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiConnector("POST", `${CREATE_ASSIGNMENT_API}/${topicId}/assignments`, payload, headers);
    if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
    return response.data.data;
}

export async function listAssignmentsByTopicAPI(topicId, token) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiConnector("GET", `${LIST_ASSIGNMENTS_BY_TOPIC_API}/${topicId}/assignments`, null, headers);
    if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
    return response.data.data;
}

export async function submitAssignmentAPI(assignmentId, payload, token) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiConnector("POST", `${SUBMIT_ASSIGNMENT_API}/${assignmentId}/submit`, payload, headers);
    if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
    return response.data.data;
}

export async function getSubmissionsAPI(assignmentId, token) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiConnector("GET", `${GET_SUBMISSIONS_API}/${assignmentId}/submissions`, null, headers);
    if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
    return response.data.data;
}

export async function gradeSubmissionAPI(submissionId, payload, token) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiConnector("POST", `${GRADE_SUBMISSION_API}/${submissionId}/grade`, payload, headers);
    if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
    return response.data.data;
}