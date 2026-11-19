import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "./lib/supabase";
import SiteHeader from "./SiteHeader";
import "./App.css";

const WHATSAPP_NUMBER = "918421941464";

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function createWhatsAppLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function ProductCard({ product, category }) {
  const message = [
    "Hello ExoFlora! I am interested in this product.",
    "",
    `Product: ${product.name}`,
    `Category: ${category}`,
    `Price: ${
      product.price !== null && product.price !== undefined
        ? `₹${Number(product.price).toLocaleString("en-IN")}`
        : "Price on request"
    }`,
    "",
    "Please share more details.",
  ].join("\n");

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
        />
        <span className="product-tag">{category}</span>
      </div>

      <div className="product-info">
        <h3>{product.name}</h3>

        {product.price !== null && product.price !== undefined ? (
          <strong className="website-product-price">
            ₹{Number(product.price).toLocaleString("en-IN")}
          </strong>
        ) : (
          <strong className="website-product-price">
            Price on request
          </strong>
        )}

        <a
          className="whatsapp-btn"
          href={createWhatsAppLink(message)}
          target="_blank"
          rel="noreferrer"
        >
          <span aria-hidden="true">◉</span> Enquire Now ↗
        </a>
      </div>
    </article>
  );
}

function CategoryPage() {
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedSubcategoryId = searchParams.get("subcategory") || "";

  const [mainCategory, setMainCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategoryProducts();
  }, [categorySlug]);

  async function fetchCategoryProducts() {
    setLoading(true);
    setError("");
    setMainCategory(null);
    setSubcategories([]);
    setProducts([]);

    try {
      const { data: categories, error: categoryError } = await supabase
        .from("categories")
        .select("id, name, parent_id")
        .order("name");

      if (categoryError) throw categoryError;

      const allCategories = categories || [];

      const selectedMainCategory = allCategories.find(
        (category) =>
          !category.parent_id &&
          slugify(category.name) === categorySlug
      );

      if (!selectedMainCategory) {
        setError("This category could not be found.");
        return;
      }

      const childCategories = allCategories.filter(
        (category) => category.parent_id === selectedMainCategory.id
      );

      const childIds = childCategories.map((category) => category.id);

      setMainCategory(selectedMainCategory);

      if (childIds.length === 0) {
        setSubcategories([]);
        setProducts([]);
        return;
      }

      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .in("category_id", childIds)
        .order("created_at", { ascending: false });

      if (productError) throw productError;

      const imageProducts = (productData || []).filter(
        (product) =>
          product.image_url &&
          product.image_url.trim() !== ""
      );

      const populatedSubcategories = childCategories.filter(
        (subcategory) =>
          imageProducts.some(
            (product) => product.category_id === subcategory.id
          )
      );

      setSubcategories(populatedSubcategories);
      setProducts(imageProducts);
    } catch (err) {
      console.error("Error fetching category products:", err);
      setError("We couldn't load this collection. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const visibleProducts = selectedSubcategoryId
    ? products.filter(
        (product) => product.category_id === selectedSubcategoryId
      )
    : products;

  const handleSubcategoryChange = (event) => {
    const value = event.target.value;

    if (value) {
      setSearchParams({ subcategory: value });
    } else {
      setSearchParams({});
    }
  };

  const selectedSubcategory = subcategories.find(
    (subcategory) => subcategory.id === selectedSubcategoryId
  );

  return (
    <>
      <SiteHeader />

      <main className="category-page">
        <section className="category-page-hero">
          <div className="category-page-hero-inner">
            <p className="eyebrow dark-eyebrow">EXPLORE EXOFLORA</p>

            <h1>{mainCategory?.name || "Our Collection"}</h1>

            <p>
              Discover beautiful floral creations, thoughtfully arranged
              for your special moments.
            </p>

            <div className="category-breadcrumb">
              <Link to="/">Home</Link>
              <span> / </span>
              <span>{mainCategory?.name || "Collection"}</span>
            </div>
          </div>
        </section>

        <section className="section category-products-section">
          {loading ? (
            <p className="products-loading">
              Loading this beautiful collection...
            </p>
          ) : error ? (
            <div className="products-message">
              <p>{error}</p>
              <button onClick={fetchCategoryProducts}>Try Again</button>
              <p>
                <Link to="/">Return to homepage</Link>
              </p>
            </div>
          ) : (
            <>
              <div className="category-filter-row">
                <div>
                  <p className="eyebrow dark-eyebrow">OUR COLLECTION</p>
                  <h2>
                    {selectedSubcategory
                      ? selectedSubcategory.name
                      : mainCategory?.name}
                  </h2>
                  <p className="category-result-count">
                    {visibleProducts.length}{" "}
                    {visibleProducts.length === 1 ? "design" : "designs"}
                  </p>
                </div>

                <div className="subcategory-filter">
                  <label htmlFor="subcategory-filter">
                    Explore by type
                  </label>

                  <select
                    id="subcategory-filter"
                    value={
                      subcategories.some(
                        (subcategory) =>
                          subcategory.id === selectedSubcategoryId
                      )
                        ? selectedSubcategoryId
                        : ""
                    }
                    onChange={handleSubcategoryChange}
                  >
                    <option value="">
                      All {mainCategory?.name}
                    </option>

                    {subcategories.map((subcategory) => (
                      <option
                        key={subcategory.id}
                        value={subcategory.id}
                      >
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {visibleProducts.length === 0 ? (
                <div className="products-message">
                  <p>
                    No products with images are available in this selection
                    right now.
                  </p>

                  {selectedSubcategoryId && (
                    <button onClick={() => setSearchParams({})}>
                      View All {mainCategory?.name}
                    </button>
                  )}
                </div>
              ) : (
                <div className="product-grid category-product-grid">
                  {visibleProducts.map((product) => {
                    const productSubcategory = subcategories.find(
                      (subcategory) =>
                        subcategory.id === product.category_id
                    );

                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        category={productSubcategory?.name || mainCategory?.name}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <Link className="brand footer-brand" to="/">
          <span className="brand-mark">❧</span>
          <span>
            ExoFlora
            <small>FLOWERS FOR EVERY MOMENT</small>
          </span>
        </Link>

        <p>Thoughtfully arranged. Beautifully remembered.</p>

        <div className="footer-links">
          <Link to="/">Home</Link>
          <a href="/#about">About Us</a>
          <a href="/#contact">Contact</a>
        </div>

        <p className="copyright">
          © {new Date().getFullYear()} ExoFlora. All rights reserved.
        </p>
      </footer>
    </>
  );
}

export default CategoryPage;