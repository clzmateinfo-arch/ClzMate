import { getPublicResource } from "@/shared/snapshot/dataCache";

const fetchCategories = async () => {
  const categories = await getPublicResource("categories");
  return (categories || []).map((category) => ({ id: category._id, name: category.name }));
};

export const NavbarLinks = [
  { title: "Home", path: "/" },
  {
    title: "Catalog",
    path: "/catalog",
    getSubLinks: fetchCategories,
  },
  { title: "About Us", path: "/about" },
  { title: "Contact Us", path: "/contact" },
];
