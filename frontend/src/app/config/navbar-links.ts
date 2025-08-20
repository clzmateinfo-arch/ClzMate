
import { fetchCourseCategories } from "@/entities/course/model/courseDetailsAPI";
const fetchCategories = async () => {
  const res = await fetchCourseCategories();
  return (res || []).map((r) => ({ id: r.id, name: r.name }));
};


export const NavbarLinks = [
  { title: "Home", path: "/" },
  {
    title: "Catalog",
    getSubLinks: fetchCategories,
  },
  { title: "About Us", path: "/about" },
  { title: "Contact Us", path: "/contact" },
];
