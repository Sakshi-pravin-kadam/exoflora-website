
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./AdminDashboard.css";

const emptyForm = {
  name: "",
  mainCategoryId: "",
  subcategoryId: "",
  description: "",
  price: "",
  image_url: "",
};

function AdminDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [activeTab, setActiveTab] = useState("products");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [mainCategoryName, setMainCategoryName] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [selectedParentId, setSelectedParentId] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const mainCategories = useMemo(
    () => categories.filter((category) => !category.parent_id),
    [categories]
  );

  const subcategories = useMemo(
    () => categories.filter((category) => category.parent_id),
    [categories]
  );

  const availableSubcategories = useMemo(
    () =>
      subcategories.filter(
        (category) => category.parent_id === form.mainCategoryId
      ),
    [subcategories, form.mainCategoryId]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        (product.description || "").toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        filterCategory === "all" ||
        product.mainCategoryId === filterCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, filterCategory]);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    setLoading(true);

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    const user = sessionData?.session?.user;

    if (sessionError || !user) {
      navigate("/admin/login");
      return;
    }

    const { data: admin, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError || !admin) {
      await supabase.auth.signOut();
      navigate("/admin/login");
      return;
    }

    await fetchCategories();
    await fetchProducts();
    setLoading(false);
  }

  async function fetchCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, parent_id, created_at")
      .order("name", { ascending: true });

    if (error) {
      setError(`Could not load categories: ${error.message}`);
      return;
    }

    setCategories(data || []);
  }

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(`Could not load products: ${error.message}`);
      return;
    }

    setProducts(data || []);
  }

  function getCategoryName(categoryId) {
    return categories.find((category) => category.id === categoryId)?.name || "Unknown category";
  }

  function getMainCategoryName(categoryId) {
    const subcategory = categories.find(
      (category) => category.id === categoryId
    );

    if (!subcategory) return "Unknown category";

    return getCategoryName(subcategory.parent_id);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function handleMainCategoryChange(event) {
    const value = event.target.value;

    setForm((previous) => ({
      ...previous,
      mainCategoryId: value,
      subcategoryId: "",
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setImageFile(null);
    setEditingId(null);

    const fileInput = document.getElementById("product-image");
    if (fileInput) fileInput.value = "";
  }

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Please enter a product name.");
      return;
    }

    if (!form.mainCategoryId || !form.subcategoryId) {
      setError("Please select a main category and subcategory.");
      return;
    }

    if (!editingId && !imageFile) {
      setError("Please upload a product image.");
      return;
    }

    if (imageFile) {
      if (!imageFile.type.startsWith("image/")) {
        setError("Please select a valid image file.");
        return;
      }

      if (imageFile.size > 5 * 1024 * 1024) {
        setError("Image size must be 5 MB or less.");
        return;
      }
    }

    setSaving(true);

    try {
      let imageUrl = form.image_url;

      if (imageFile) {
        const safeName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "-");
        const filePath = `${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: imageData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        imageUrl = imageData.publicUrl;
      }

      const productData = {
        name: form.name.trim(),
        category_id: form.subcategoryId,
        description: form.description.trim() || null,
        price: form.price === "" ? null : Number(form.price),
        image_url: imageUrl,
      };

      let result;

      if (editingId) {
        result = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingId);
      } else {
        result = await supabase
          .from("products")
          .insert([productData]);
      }

      if (result.error) throw result.error;

      setSuccess(
        editingId
          ? "Product updated successfully!"
          : "Product added successfully!"
      );

      resetForm();
      await fetchProducts();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(product) {
    const selectedSubcategory = categories.find(
      (category) => category.id === product.category_id
    );

    setEditingId(product.id);
    setForm({
      name: product.name || "",
      mainCategoryId: selectedSubcategory?.parent_id || "",
      subcategoryId: product.category_id || "",
      description: product.description || "",
      price: product.price ?? "",
      image_url: product.image_url || "",
    });

    setImageFile(null);
    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      setError(error.message);
      return;
    }

    if (editingId === product.id) resetForm();

    setSuccess("Product deleted successfully!");
    await fetchProducts();
  }

  async function handleAddMainCategory(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = mainCategoryName.trim();

    if (!name) {
      setError("Enter a main category name.");
      return;
    }

    const { error } = await supabase
      .from("categories")
      .insert([{ name, parent_id: null }]);

    if (error) {
      setError(error.message);
      return;
    }

    setMainCategoryName("");
    setSuccess("Main category added successfully!");
    await fetchCategories();
  }

  async function handleAddSubcategory(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = subcategoryName.trim();

    if (!name || !selectedParentId) {
      setError("Enter a subcategory name and select its main category.");
      return;
    }

    const { error } = await supabase
      .from("categories")
      .insert([{ name, parent_id: selectedParentId }]);

    if (error) {
      setError(error.message);
      return;
    }

    setSubcategoryName("");
    setSuccess("Subcategory added successfully!");
    await fetchCategories();
  }

  async function handleRenameCategory(category) {
    const newName = window.prompt(
      `Enter a new name for "${category.name}":`,
      category.name
    );

    if (newName === null) return;

    if (!newName.trim()) {
      setError("Category name cannot be empty.");
      return;
    }

    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("categories")
      .update({ name: newName.trim() })
      .eq("id", category.id);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Category renamed successfully!");
    await fetchCategories();
  }

  async function handleDeleteCategory(category) {
    const confirmed = window.confirm(
      `Delete "${category.name}"? Categories used by products or containing subcategories cannot be deleted.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id);

    if (error) {
      setError(
        "Could not delete this category. It may contain subcategories or be assigned to products."
      );
      return;
    }

    setSuccess("Category deleted successfully!");
    await fetchCategories();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  if (loading) {
    return <div className="admin-loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <h1>ExoFlora</h1>
          <p>Admin Panel</p>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className="dashboard-container">
        <section className="dashboard-welcome">
          <div>
            <span className="dashboard-eyebrow">STORE MANAGEMENT</span>
            <h2>Welcome to your dashboard</h2>
            <p>Manage your products and floral collections in one place.</p>
          </div>

          <div className="product-count">
            <span>Total Products</span>
            <strong>{products.length}</strong>
          </div>
        </section>

        <nav className="dashboard-tabs">
          <button
            className={activeTab === "products" ? "active" : ""}
            onClick={() => {
              setActiveTab("products");
              setError("");
              setSuccess("");
            }}
          >
            Products
          </button>

          <button
            className={activeTab === "categories" ? "active" : ""}
            onClick={() => {
              setActiveTab("categories");
              setError("");
              setSuccess("");
            }}
          >
            Categories
          </button>
        </nav>

        {error && <p className="dashboard-error">{error}</p>}
        {success && <p className="dashboard-success">{success}</p>}

        {activeTab === "products" && (
          <>
            <section className="product-form-section">
              <div className="section-heading">
                <div>
                  <span className="dashboard-eyebrow">PRODUCT CATALOGUE</span>
                  <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>
                  <p>Add a product to your ExoFlora collection.</p>
                </div>
              </div>

              {categories.length === 0 && (
                <div className="dashboard-notice">
                  Add your main categories and subcategories in the Categories
                  section before adding products.
                </div>
              )}

              <form onSubmit={handleSave} className="product-form">
                <label>
                  Product Name <span>*</span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Example: Red Rose Bouquet"
                    required
                  />
                </label>

                <div className="form-two-columns">
                  <label>
                    Main Category <span>*</span>
                    <select
                      value={form.mainCategoryId}
                      onChange={handleMainCategoryChange}
                      required
                    >
                      <option value="">Select main category</option>
                      {mainCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Subcategory <span>*</span>
                    <select
                      name="subcategoryId"
                      value={form.subcategoryId}
                      onChange={handleChange}
                      required
                      disabled={!form.mainCategoryId}
                    >
                      <option value="">Select subcategory</option>
                      {availableSubcategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  Description <small>(Optional)</small>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe your product..."
                    rows="4"
                  />
                </label>

                <label>
                  Price in ₹ <small>(Optional)</small>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="Leave empty if price is on request"
                  />
                </label>

                <label>
                  Product Image <span>*</span>
                  <input
                    id="product-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      setImageFile(event.target.files?.[0] || null)
                    }
                    required={!editingId}
                  />
                  <small>
                    Upload one image only. JPG, PNG or WebP, maximum 5 MB.
                    {editingId && " Leave empty to keep the current image."}
                  </small>
                </label>

                {(imageFile || form.image_url) && (
                  <div className="image-preview-wrapper">
                    <img
                      src={
                        imageFile
                          ? URL.createObjectURL(imageFile)
                          : form.image_url
                      }
                      alt="Product preview"
                      className="image-preview"
                    />
                    <span>{imageFile ? imageFile.name : "Current image"}</span>
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" disabled={saving}>
                    {saving
                      ? "Saving..."
                      : editingId
                      ? "Update Product"
                      : "Add Product"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section className="products-section">
              <div className="products-heading">
                <div>
                  <span className="dashboard-eyebrow">YOUR COLLECTION</span>
                  <h2>Your Products</h2>
                  <p>{filteredProducts.length} products shown</p>
                </div>
              </div>

              <div className="product-filters">
                <input
                  type="search"
                  placeholder="Search products..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />

                <select
                  value={filterCategory}
                  onChange={(event) => setFilterCategory(event.target.value)}
                >
                  <option value="all">All main categories</option>
                  {mainCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="empty-products">
                  <h3>No products found</h3>
                  <p>
                    {products.length === 0
                      ? "Add your first product using the form above."
                      : "Try changing your search or category filter."}
                  </p>
                </div>
              ) : (
                <div className="products-grid">
                  {filteredProducts.map((product) => (
                    <article className="product-card" key={product.id}>
                      <div className="product-image-wrapper">
                        <img src={product.image_url} alt={product.name} />
                      </div>

                      <div className="product-card-content">
                        <span className="product-category">
                          {getMainCategoryName(product.category_id)}
                        </span>

                        <span className="product-subcategory">
                          {getCategoryName(product.category_id)}
                        </span>

                        <h3>{product.name}</h3>

                        {product.description && (
                          <p className="product-description">
                            {product.description}
                          </p>
                        )}

                        <strong className="product-price">
                          {product.price !== null &&
                          product.price !== undefined
                            ? `₹${Number(product.price).toLocaleString("en-IN")}`
                            : "Price on request"}
                        </strong>

                        <div className="product-card-actions">
                          <button onClick={() => handleEdit(product)}>
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            onClick={() => handleDelete(product)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === "categories" && (
          <section className="categories-section">
            <div className="section-heading">
              <div>
                <span className="dashboard-eyebrow">ORGANIZE YOUR STORE</span>
                <h2>Category Management</h2>
                <p>
                  Create and manage your main categories and subcategories.
                </p>
              </div>
            </div>

            <div className="category-create-grid">
              <form
                className="category-create-card"
                onSubmit={handleAddMainCategory}
              >
                <h3>Add Main Category</h3>
                <p>Example: Bouquets, Gift Hampers, Car Decoration</p>

                <label>
                  Main category name
                  <input
                    value={mainCategoryName}
                    onChange={(event) =>
                      setMainCategoryName(event.target.value)
                    }
                    placeholder="Enter category name"
                    required
                  />
                </label>

                <button type="submit">Add Main Category</button>
              </form>

              <form
                className="category-create-card"
                onSubmit={handleAddSubcategory}
              >
                <h3>Add Subcategory</h3>
                <p>Choose which main category it belongs to.</p>

                <label>
                  Main category
                  <select
                    value={selectedParentId}
                    onChange={(event) =>
                      setSelectedParentId(event.target.value)
                    }
                    required
                  >
                    <option value="">Select main category</option>
                    {mainCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Subcategory name
                  <input
                    value={subcategoryName}
                    onChange={(event) =>
                      setSubcategoryName(event.target.value)
                    }
                    placeholder="Enter subcategory name"
                    required
                  />
                </label>

                <button type="submit" disabled={mainCategories.length === 0}>
                  Add Subcategory
                </button>
              </form>
            </div>

            <div className="category-list-section">
              <h3>Your Categories</h3>

              {mainCategories.length === 0 ? (
                <div className="empty-products">
                  No categories created yet.
                </div>
              ) : (
                <div className="category-list">
                  {mainCategories.map((mainCategory) => {
                    const children = subcategories.filter(
                      (subcategory) =>
                        subcategory.parent_id === mainCategory.id
                    );

                    return (
                      <div className="category-group" key={mainCategory.id}>
                        <div className="category-group-heading">
                          <div>
                            <span className="category-level-label">
                              MAIN CATEGORY
                            </span>
                            <h4>{mainCategory.name}</h4>
                            <small>
                              {children.length} subcategories
                            </small>
                          </div>

                          <div className="category-actions">
                            <button
                              onClick={() =>
                                handleRenameCategory(mainCategory)
                              }
                            >
                              Rename
                            </button>
                            <button
                              className="delete-button"
                              onClick={() =>
                                handleDeleteCategory(mainCategory)
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        <div className="subcategory-list">
                          {children.length === 0 ? (
                            <p className="no-subcategories">
                              No subcategories added.
                            </p>
                          ) : (
                            children.map((subcategory) => (
                              <div
                                className="subcategory-item"
                                key={subcategory.id}
                              >
                                <span>{subcategory.name}</span>

                                <div className="category-actions">
                                  <button
                                    onClick={() =>
                                      handleRenameCategory(subcategory)
                                    }
                                  >
                                    Rename
                                  </button>
                                  <button
                                    className="delete-button"
                                    onClick={() =>
                                      handleDeleteCategory(subcategory)
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
