import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import CourseGrid from "@/features/courseCatalog/ui/CourseGrid";
import CourseSlider from "@/features/courseCatalog/ui/CourseSlider";
import CatalogHeader from "@/features/courseCatalog/ui/CatalogHeader";
import CatalogSidebar from "@/features/courseCatalog/ui/CatalogSidebar";
import Footer from "@/widgets/Footer/Footer";
import Loading from "@/shared/components/navigation/Loading";
import { fetchCourseCategories } from "@/entities/course/model/courseDetailsAPI";
import { getCatalogPageData } from "@/shared/operations/pageAndComponentData";
import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";

export default function Catalog() {
  const { catalogName } = useParams();
  const [catalogPageData, setCatalogPageData] = useState(null);
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ price: "all", level: "all" });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchCourseCategories();
        const matched = res.find(
          (ct) => ct.name.split(" ").join("-").toLowerCase() === catalogName
        );
        if (matched) setCategoryId(matched._id);
      } catch (error) {
        console.error("Could not fetch Categories.", error);
      }
    })();
  }, [catalogName]);

  useEffect(() => {
    if (!categoryId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await getCatalogPageData(categoryId);
        setCatalogPageData(res);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [categoryId]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((s) => !s);
  }, []);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const handleFiltersChange = useCallback((nextFilters) => {
    setFilters((prev) => ({ ...prev, ...nextFilters }));
  }, []);

  if (loading) {
    return (
      <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center">
        <Loading />
      </div>
    );
  }

  if (!loading && !catalogPageData) {
    return (
      <div className="text-white text-4xl flex justify-center items-center mt-[20%]">
        No Courses found for selected Category
      </div>
    );
  }

  return (
    <>
      <CatalogHeader
        title={catalogPageData?.selectedCategory?.name}
        subtitle={catalogPageData?.selectedCategory?.name}
        description={catalogPageData?.selectedCategory?.description}
        background={backImg}
        onSearch={handleSearch}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          <div className={`${sidebarOpen ? "w-72" : "w-0"} transition-all duration-300 overflow-hidden`}>
            <CatalogSidebar
              categories={catalogPageData?.allCategories ?? []}
              selectedCategoryId={categoryId}
              onChange={handleFiltersChange}
              onClose={() => setSidebarOpen(false)}
              visible={sidebarOpen}
            />
          </div>

          <div className="flex-1">
            <CourseSlider
              categoryId={categoryId}
              initialFeatured={catalogPageData?.selectedCategory?.courses ?? []}
              searchTerm={searchTerm}
              filters={filters}
              onToggleSidebar={handleToggleSidebar}
            />
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
