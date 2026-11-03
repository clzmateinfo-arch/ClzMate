import { categories, courseEndpoints, commanEndpoints, ratingsEndpoints, catalogData } from "@/app/config/apis";

const pickData = (body) => body?.data;
const pickCourses = (body) => body?.data?.courses;

const listResource = (request, pick) => ({ request, pick, kind: "array" });

const RESOURCE_FAMILIES = {
  categories: listResource(() => ({ method: "GET", url: categories.CATEGORIES_API }), pickData),
  newCourses: listResource(
    () => ({ method: "GET", url: courseEndpoints.GET_ALL_COURSE_API, params: { page: 1, limit: 3 } }),
    pickCourses
  ),
  popularCourses: listResource(
    () => ({ method: "GET", url: courseEndpoints.GET_ALL_COURSE_API, params: { page: 1, limit: 3, sort: "popular" } }),
    pickCourses
  ),
  reviews: listResource(() => ({ method: "GET", url: ratingsEndpoints.REVIEWS_DETAILS_API }), pickData),
  stats: {
    request: () => ({ method: "GET", url: commanEndpoints.SITE_STATS_API }),
    pick: pickData,
    kind: "object",
  },
  course: {
    request: (courseId) => ({ method: "POST", url: courseEndpoints.COURSE_DETAILS_API, data: { courseId } }),
    pick: (body) => (body?.success === true ? body : undefined),
    kind: "object",
    isParameterized: true,
  },
  catalog: {
    request: (categoryId) => ({ method: "POST", url: catalogData.CATALOGPAGEDATA_API, data: { categoryId } }),
    pick: pickData,
    kind: "object",
    isParameterized: true,
  },
};

export const SNAPSHOT_FAMILIES = Object.keys(RESOURCE_FAMILIES);

export function parseResourceKey(key) {
  const separatorIndex = key.indexOf(":");
  const family = separatorIndex === -1 ? key : key.slice(0, separatorIndex);
  const param = separatorIndex === -1 ? null : key.slice(separatorIndex + 1);
  const definition = RESOURCE_FAMILIES[family];
  if (!definition) throw new Error(`Unknown public resource "${key}"`);
  if (Boolean(definition.isParameterized) !== Boolean(param)) throw new Error(`Invalid public resource key "${key}"`);
  return { family, param, definition };
}

export function hasExpectedShape(definition, value) {
  if (definition.kind === "array") return Array.isArray(value);
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function hasContent(value) {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value) && typeof value === "object" && Object.keys(value).length > 0;
}

export function lookupInSnapshot(snapshot, key) {
  const { family, param, definition } = parseResourceKey(key);
  const familyValue = snapshot?.resources?.[family];
  const value = param ? familyValue?.[param] : familyValue;
  return hasExpectedShape(definition, value) ? value : undefined;
}

const CONTENT_MUTATION_PATH =
  /\/(course\/(createCourse|addSection|updateSection|deleteSection|addSubSection|updateSubSection|deleteSubSection|editCourse|togglePublish|deleteCourse|createCategory|updateCategory|deleteCategory|createRating|enrollmentRequests\/[^/]+\/[^/]+\/respond)|admin\/(updateUser|deleteUser)|payment\/verifyPayment|profile\/(deleteProfile|updateProfile|updateUserProfileImage))\/?(\?|$)/;

export const isContentMutationUrl = (url) => CONTENT_MUTATION_PATH.test(String(url || ""));
