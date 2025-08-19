import { apiConnector } from "../../shared/services/api/apiConnector";
import { catalogData } from "../../app/config/apis";

export const getCatalogPageData = async (categoryId) => {
  let result = [];
  try {
    const response = await apiConnector(
      "POST",
      catalogData.CATALOGPAGEDATA_API,
      { categoryId: categoryId },
      undefined,
      undefined
    );

    if (!response?.data?.success)
      throw new Error("Could not Fetch Category page data");

    console.log("CATALOG PAGE DATA API RESPONSE............", response);
    result = response?.data?.data;
  } catch (error) {
    console.log("CATALOG PAGE DATA API ERROR....", error);
    result = error.response?.data.data;
  }
  return result;
};
