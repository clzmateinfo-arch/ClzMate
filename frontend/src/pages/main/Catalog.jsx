import { useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import CourseSlider from "@/features/courseCatalog/ui/CourseSlider";
import CatalogSidebar from "@/features/courseCatalog/ui/CatalogSidebar";
import Footer from "@/widgets/Footer/Footer";
import Loading from "@/shared/components/navigation/Loading";
import { usePublicResource } from "@/shared/snapshot/dataCache";
import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";
import PageHeader from "@/shared/components/ui/PageHeader";

export default function Catalog() {
  const { catalogId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ price: "all" });

  const categoriesResource = usePublicResource("categories");
  const categoryId = useMemo(
    () =>
      (categoriesResource.data ?? []).find(
        (category) => String(category._id).split(" ").join("").toLowerCase() === catalogId
      )?._id ?? "",
    [categoriesResource.data, catalogId]
  );
  const catalogResource = usePublicResource(categoryId ? `catalog:${categoryId}` : null);
  const catalogPageData = catalogResource.data ?? null;
  const loading = !categoriesResource.isSettled || Boolean(categoryId && !catalogResource.isSettled);

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
      <div className="text-black text-m flex justify-center items-center mt-[20%]">
        No Courses found for selected Category
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      <PageHeader
        title={catalogPageData?.selectedCategory?.name}
        subtitle={catalogPageData?.selectedCategory?.name}
        description={catalogPageData?.selectedCategory?.description}
        background={backImg}
        showSearch={true}
        onSearch={handleSearch}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          <div className={`${sidebarOpen ? "w-72" : "w-0"} transition-all duration-300 overflow-hidden`}>
            <CatalogSidebar
              categories={categoriesResource.data ?? []}
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
    </div>
  );
}
