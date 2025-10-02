import { apiConnector } from "@/shared/services/api/apiConnector";
import { toast } from "react-hot-toast";
import { classroomEndpoints } from "@/app/config/apis";

const {
    CREATE_CLASSROOM_API,
    GET_MY_CLASSROOMS_API,
    JOIN_CLASSROOM_API,
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
