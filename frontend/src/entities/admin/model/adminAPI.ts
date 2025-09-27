import { apiConnector } from "@/shared/services/api/apiConnector";
import { toast } from "react-hot-toast";
import { adminEndpoints } from "@/app/config/apis";

const {
    GET_USERS,
    UPDATE_USER,
    DELETE_USER,
    CREATE_CATEGORY,
    GET_CATEGORIES,
    UPDATE_CATEGORY,
    DELETE_CATEGORY,
} = adminEndpoints;


export const fetchUsers = async (token, { q = "", page = 1, limit = 50 } = {}) => {
    try {
        const response = await apiConnector("POST", GET_USERS, { q, page, limit }, { Authorization: `Bearer ${token}` });
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        return response.data.data;
    } catch (e) {
        console.error(e);
        toast.error(e.message || "Failed to fetch users");
        return null;
    }
};

export const updateUser = async (token, payload) => {
    try {
        const response = await apiConnector("POST", UPDATE_USER, payload, { Authorization: `Bearer ${token}` });
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        toast.success("User updated");
        return response.data.data;
    } catch (e) {
        console.error(e);
        toast.error(e.message || "Failed to update user");
        return null;
    }
};

export const deleteUser = async (token, userId) => {
    try {
        const response = await apiConnector("POST", DELETE_USER, { userId }, { Authorization: `Bearer ${token}` });
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        toast.success("User deleted");
        return true;
    } catch (e) {
        console.error(e);
        toast.error(e.message || "Failed to delete user");
        return false;
    }
};

// categories
export const createCategory = async (token, payload) => {
    try {
        const response = await apiConnector("POST", CREATE_CATEGORY, payload, { Authorization: `Bearer ${token}` });
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        toast.success("Category created");
        return true;
    } catch (e) {
        console.error(e);
        toast.error(e.message || "Failed to create category");
        return false;
    }
};

export const fetchCategories = async () => {
    try {
        const response = await apiConnector("GET", GET_CATEGORIES);
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        return response.data.data;
    } catch (e) {
        console.error(e);
        toast.error(e.message || "Failed to load categories");
        return [];
    }
};

export const updateCategoryAPI = async (token, payload) => {
    try {
        const response = await apiConnector("POST", UPDATE_CATEGORY, payload, { Authorization: `Bearer ${token}` });
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        toast.success("Category updated");
        return response.data.data;
    } catch (e) {
        console.error(e);
        toast.error(e.message || "Failed to update category");
        return null;
    }
};

export const deleteCategoryAPI = async (token, categoryId) => {
    try {
        const response = await apiConnector("POST", DELETE_CATEGORY, { categoryId }, { Authorization: `Bearer ${token}` });
        if (!response?.data?.success) throw new Error(response?.data?.message || "Failed");
        toast.success("Category deleted");
        return true;
    } catch (e) {
        console.error(e);
        toast.error(e.message || "Failed to delete category");
        return false;
    }
};
