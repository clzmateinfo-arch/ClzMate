import { apiConnector } from "@/shared/services/api/apiConnector";
import { toast } from "react-hot-toast";
import { classroomEndpoints } from "@/app/config/apis";

const { MANAGE_TOPICS_API, CREATE_TOPIC_API, ASSIGNMENTS_API, QUIZZES_API } = classroomEndpoints || {};

const safeHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

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
