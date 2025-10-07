import { apiConnector } from "@/shared/services/api/apiConnector";
import { toast } from "react-hot-toast";
import { classroomEndpoints } from "@/app/config/apis";

const {
    CREATE_CLASSROOM_API,
    GET_MY_CLASSROOMS_API,
    JOIN_CLASSROOM_API,
    GET_CLASS_OVERVIEW_API,
    CREATE_TOPIC_API,
    LIST_TOPICS_API,
    MANAGE_TOPICS_API,
    ASSIGNMENTS_API,
    QUIZZES_API,
} = classroomEndpoints || {};

const safeHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

export async function createClassroomAPI(payload, token) {
    try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await apiConnector("POST", CREATE_CLASSROOM_API, payload, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed to create classroom");
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
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed to fetch classrooms");
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
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed to join classroom");
        toast.success(response?.data?.message || "Joined classroom");
        return response.data.data;
    } catch (err) {
        console.error("joinClassroomByCodeAPI error", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to join classroom");
        throw err;
    }
}

export async function fetchClassOverviewAPI(classroomId, token) {
    try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await apiConnector("GET", `${GET_CLASS_OVERVIEW_API}/${classroomId}/overview`, null, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        return response.data.data;
    } catch (err) {
        console.error("fetchClassOverviewAPI error", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to load overview");
        throw err;
    }
}

export async function listTopicsAPI(classroomId, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("GET", `${LIST_TOPICS_API}/${classroomId}/topics`, null, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        return response.data.data || [];
    } catch (err) {
        console.error("listTopicsAPI error", err);
        toast.error(err?.response?.data?.message || err.message || "Failed to load topics");
        throw err;
    }
}

export async function createTopicAPI(classroomId, payload, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("POST", `${CREATE_TOPIC_API}/${classroomId}/topics`, payload, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        toast.success("Topic created");
        return response.data.data;
    } catch (err) {
        console.error("createTopicAPI error", err);
        toast.error(err?.response?.data?.message || err.message || "Failed to create topic");
        throw err;
    }
}

export async function updateTopicAPI(topicId, payload, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("PATCH", `${MANAGE_TOPICS_API}/${topicId}`, payload, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        return response.data.data;
    } catch (err) {
        console.error("updateTopicAPI error", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to update topic");
        throw err;
    }
}

export async function deleteTopicAPI(topicId, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("DELETE", `${MANAGE_TOPICS_API}/${topicId}`, null, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        toast.success("Topic deleted");
        return response.data;
    } catch (err) {
        console.error("deleteTopicAPI error", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to delete topic");
        throw err;
    }
}

export async function reorderTopicsAPI(classroomId, order, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("POST", `${CREATE_TOPIC_API}/${classroomId}/topics/reorder`, { order }, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        return response.data;
    } catch (err) {
        console.error("reorderTopicsAPI error", err);
        toast.error(err?.response?.data?.message || err.message || "Failed to reorder topics");
        throw err;
    }
}

export async function createItemAPI(topicId, payload, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("POST", `${MANAGE_TOPICS_API}/${topicId}/items`, payload, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        toast.success("Item created");
        return response.data.data;
    } catch (err) {
        console.error("createItemAPI error", err);
        toast.error(err?.response?.data?.message || err.message || "Failed to create item");
        throw err;
    }
}

export async function reorderItemsAPI(topicId, order, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("POST", `${MANAGE_TOPICS_API}/${topicId}/items/reorder`, { order }, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        return response.data;
    } catch (err) {
        console.error("reorderItemsAPI error", err);
        toast.error(err?.response?.data?.message || err.message || "Failed to reorder items");
        throw err;
    }
}

export async function updateItemAPI(topicId, itemId, payload, token, isFormData = false) {
    try {
        const headers = safeHeaders(token);
        const options = isFormData ? { isFormData: true } : {};
        const response = await apiConnector("PATCH", `${MANAGE_TOPICS_API}/${topicId}/items/${itemId}`, payload, headers, options);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        return response.data.data;
    } catch (err) {
        console.error("updateItemAPI error", err);
        toast.error(err?.response?.data?.message || err.message || "Failed to update item");
        throw err;
    }
}

export async function deleteItemAPI(topicId, itemId, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("DELETE", `${MANAGE_TOPICS_API}/${topicId}/items/${itemId}`, null, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        toast.success("Deleted");
        return response.data;
    } catch (err) {
        console.error("deleteItemAPI error", err);
        toast.error(err?.response?.data?.message || err.message || "Failed");
        throw err;
    }
}

export async function toggleItemStatusAPI(topicId, itemId, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("PATCH", `${MANAGE_TOPICS_API}/${topicId}/items/${itemId}/toggle`, null, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        toast.success("Status updated");
        return response.data.data;
    } catch (err) {
        console.error("toggleItemStatusAPI error", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed");
        throw err;
    }
}

export async function copyItemAPI(topicId, itemId, destTopicId, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("POST", `${MANAGE_TOPICS_API}/${topicId}/items/${itemId}/copy`, { destTopicId }, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        toast.success("Copied");
        return response.data.data;
    } catch (err) {
        console.error("copyItemAPI error", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed");
        throw err;
    }
}

export async function createAssignmentAPI(topicId, payload, token, isFormData = false) {
    try {
        const headers = safeHeaders(token);
        const body = isFormData ? payload : payload;
        const response = await apiConnector("POST", `${MANAGE_TOPICS_API}/${topicId}/assignments`, body, headers, isFormData ? { isFormData: true } : {});
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        toast.success("Assignment created");
        return response.data.data;
    } catch (err) {
        console.error("createAssignmentAPI error", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to create assignment");
        throw err;
    }
}

export async function getAssignmentAPI(assignmentId, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("GET", `${MANAGE_TOPICS_API.replace(/\/topics$/, "")}/assignments/${assignmentId}`, null, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        return response.data.data;
    } catch (err) {
        console.error("getAssignmentAPI error", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to load assignment");
        throw err;
    }
}

export async function updateAssignmentAPI(assignmentId, payload, token, isFormData = false) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("PATCH", `${ASSIGNMENTS_API}/${assignmentId}`, payload, headers, isFormData ? { isFormData: true } : {});
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        toast.success("Assignment updated");
        return response.data.data;
    } catch (err) {
        console.error("updateAssignmentAPI error", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to update assignment");
        throw err;
    }
}

export async function listAssignmentsByTopicAPI(topicId, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("GET", `${MANAGE_TOPICS_API}/${topicId}/assignments`, null, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        return response.data.data;
    } catch (err) {
        console.error("listAssignmentsByTopicAPI error", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to load assignments");
        throw err;
    }
}

export async function listPublishedAssignmentsByTopicAPI(topicId, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("GET", `${MANAGE_TOPICS_API}/${topicId}/assignments/published`, null, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        return response.data.data;
    } catch (err) {
        console.error("listPublishedAssignmentsByTopicAPI error", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to load assignments");
        throw err;
    }
}

export async function deleteAssignmentAPI(assignmentId, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("DELETE", `${ASSIGNMENTS_API}/${assignmentId}`, null, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        toast.success("Assignment deleted");
        return response.data;
    } catch (err) {
        console.error("deleteAssignmentAPI error", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to delete assignment");
        throw err;
    }
}

export async function createQuizAPI(topicId, payload, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("POST", `${MANAGE_TOPICS_API}/${topicId}/quizzes`, payload, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        toast.success("Quiz created");
        return response.data.data;
    } catch (err) {
        console.error("createQuizAPI error", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to create quiz");
        throw err;
    }
}

export async function getQuizAPI(quizId, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("GET", `${QUIZZES_API}/${quizId}`, null, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        return response.data.data;
    } catch (err) {
        console.error("getQuizAPI", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to load quiz");
        throw err;
    }
}

export async function updateQuizAPI(quizId, payload, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("PATCH", `${QUIZZES_API}/${quizId}`, payload, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        toast.success("Quiz updated");
        return response.data.data;
    } catch (err) {
        console.error("updateQuizAPI", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to update quiz");
        throw err;
    }
}

export async function listQuizzesByTopicAPI(topicId, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("GET", `${MANAGE_TOPICS_API}/${topicId}/quizzes`, null, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        return response.data.data || [];
    } catch (err) {
        console.error("listQuizzesByTopicAPI error", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to load quizzes");
        throw err;
    }
}

export async function listPublishedQuizzesByTopicAPI(topicId, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("GET", `${MANAGE_TOPICS_API}/${topicId}/quizzes/published`, null, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        return response.data.data || [];
    } catch (err) {
        console.error("listPublishedQuizzesByTopicAPI error", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to load quizzes");
        throw err;
    }
}

export async function deleteQuizAPI(quizId, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("DELETE", `${QUIZZES_API}/${quizId}`, null, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        toast.success("Quiz deleted");
        return response.data;
    } catch (err) {
        console.error("deleteQuizAPI error", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to delete quiz");
        throw err;
    }
}

export async function createScreenAPI(quizId, payload, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("POST", `${QUIZZES_API}/${quizId}/screens`, payload, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        toast.success("Screen created");
        return response.data.data;
    } catch (err) {
        console.error("createScreenAPI", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to create screen");
        throw err;
    }
}

export async function updateScreenAPI(screenId, payload, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("PATCH", `${QUIZZES_API}/screens/${screenId}`, payload, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        return response.data.data;
    } catch (err) {
        console.error("updateScreenAPI", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to update screen");
        throw err;
    }
}

export async function deleteScreenAPI(quizId, screenId, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("DELETE", `${QUIZZES_API}/${quizId}/screens/${screenId}`, null, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        toast.success("Deleted");
        return response.data;
    } catch (err) {
        console.error("deleteScreenAPI", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to delete screen");
        throw err;
    }
}

export async function reorderScreensAPI(quizId, order, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("POST", `${QUIZZES_API}/${quizId}/screens/reorder`, { order }, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        return response.data;
    } catch (err) {
        console.error("reorderScreensAPI", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to reorder screens");
        throw err;
    }
}

export async function submitAssignmentAPI(assignmentId, { files = [], content = "", removeAttachments = [] } = {}, token) {
    try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const form = new FormData();
        form.append("content", content || "");
        if (Array.isArray(removeAttachments) && removeAttachments.length) {
            form.append("removeAttachments", JSON.stringify(removeAttachments));
        }
        if (Array.isArray(files) && files.length) {
            files.forEach((f) => {
                form.append("attachments", f);
            });
        }
        const response = await apiConnector("POST", `${ASSIGNMENTS_API}/${assignmentId}/submit`, form, headers, { isFormData: true });
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed to submit assignment");
        return response.data.data;
    } catch (err) {
        console.error("submitAssignmentAPI error", err);
        throw err;
    }
}

export async function getMySubmissionAPI(assignmentId, token) {
    try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await apiConnector("GET", `${ASSIGNMENTS_API}/${assignmentId}/submission`, null, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        return response.data.data;
    } catch (err) {
        console.error("getMySubmissionAPI error", err);
        throw err;
    }
}

export async function getSubmissionsByAssignmentAPI(assignmentId, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("GET", `${ASSIGNMENTS_API}/${assignmentId}/submissions`, null, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        return response.data.data || [];
    } catch (err) {
        console.error("getSubmissionsByAssignmentAPI error", err);
        throw err;
    }
}

export async function updateSubmissionAPI(assignmentId, submissionId, payload = {}, token) {
    try {
        const headers = safeHeaders(token);
        const response = await apiConnector("PATCH", `${ASSIGNMENTS_API}/${assignmentId}/submissions/${submissionId}`, payload, headers);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        toast.success("Submission updated");
        return response.data.data;
    } catch (err) {
        console.error("updateSubmissionAPI error", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to update submission");
        throw err;
    }
}

export async function submitQuizAttemptAPI(quizId, payload = {}, token) {
  try {
    const headers = safeHeaders(token);
    const response = await apiConnector("POST", `${QUIZZES_API}/${quizId}/attempts`, payload, headers);
    if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
    return response.data.data;
  } catch (err) {
    console.error("submitQuizAttemptAPI error", err);
    toast.error(err?.response?.data?.message || err?.message || "Failed to submit attempt");
    throw err;
  }
}

export async function getQuizLeaderboardAPI(quizId, token) {
  try {
    const headers = safeHeaders(token);
    const response = await apiConnector("GET", `${QUIZZES_API}/${quizId}/leaderboard`, null, headers);
    if (!response?.data?.success) throw new Error(response?.data?.message || "Failed to fetch leaderboard");
    return response.data.data; // { board, me }
  } catch (err) {
    console.error("getQuizLeaderboardAPI error", err);
    toast.error(err?.response?.data?.message || err?.message || "Failed to load leaderboard");
    throw err;
  }
}
