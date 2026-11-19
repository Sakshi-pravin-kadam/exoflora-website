import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./App.css";
import { supabase } from "./lib/supabase";
import SiteHeader from "./SiteHeader";

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

function WhatsAppButton({
  children = "Order on WhatsApp",
  className = "",
  message = "Hello ExoFlora! I would like to enquire about your flowers and arrangements.",
}) {
  return (
    <a
      className={`whatsapp-btn ${className}`}
      href={createWhatsAppLink(message)}
      target="_blank"
      rel="noreferrer"
    >
      <span aria-hidden="true">◉</span> {children} ↗
    </a>
  );
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

        <WhatsAppButton message={message}>
          Enquire Now
        </WhatsAppButton>
      </div>
    </article>
  );
}

function HomePage() {
  const [catalogue, setCatalogue] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    product: "Bouquet",
    flowers: "",
    colours: "",
    budget: "",
    date: "",
    delivery: "Delivery",
    instructions: "",
  });

  useEffect(() => {
    fetchCatalogue();
  }, []);

  async function fetchCatalogue() {
    setProductsLoading(true);
    setProductsError("");

    try {
      const { data: categories, error: categoryError } = await supabase
        .from("categories")
        .select("id, name, parent_id")
        .order("name");

      if (categoryError) throw categoryError;

      const { data: products, error: productError } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (productError) throw productError;

      const allCategories = categories || [];
      const allProducts = (products || []).filter(
        (product) =>
          product.image_url &&
          product.image_url.trim() !== ""
      );

      const mainCategories = allCategories
        .filter((category) => !category.parent_id)
        .map((mainCategory) => {
          const subcategories = allCategories
            .filter((sub) => sub.parent_id === mainCategory.id)
            .map((subcategory) => {
              const subcategoryProducts = allProducts.filter(
                (product) => product.category_id === subcategory.id
              );

              return {
                ...subcategory,
                products: subcategoryProducts,
              };
            })
            .filter((subcategory) => subcategory.products.length > 0);

          return {
            ...mainCategory,
            subcategories,
          };
        })
        .filter((mainCategory) => mainCategory.subcategories.length > 0);

      setCatalogue(mainCategories);
    } catch (error) {
      console.error("Error fetching catalogue:", error);
      setProductsError(
        "We couldn't load our products right now. Please try again later."
      );
    } finally {
      setProductsLoading(false);
    }
  }

  const updateForm = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const submitOrder = (event) => {
    event.preventDefault();

    const message = [
      "Hello ExoFlora! I would like to place a custom order.",
      "",
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `Product: ${form.product}`,
      `Preferred flowers: ${form.flowers || "Not specified"}`,
      `Preferred colours: ${form.colours || "Not specified"}`,
      `Budget: ${form.budget || "Please suggest"}`,
      `Required date: ${form.date || "To be discussed"}`,
      `Preference: ${form.delivery}`,
      `Instructions: ${form.instructions || "None"}`,
    ].join("\n");

    window.open(
      createWhatsAppLink(message),
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <>
      <SiteHeader />

      <main>
        {/* HERO SECTION */}
        <section className="hero" id="home">
          <div className="hero-overlay" />

          <div className="hero-content">
            <p className="eyebrow">
              FRESH FLOWERS · FLORAL DECOR · CUSTOM ORDERS
            </p>

            <h1>
              Every Flower<br />
              Tells a Story<span>.</span>
            </h1>

            <p className="hero-description">
              Beautiful blooms, thoughtfully arranged for life's special moments.
            </p>

            <div className="hero-actions">
              <a className="gold-btn" href="#catalogue">
                Explore Collection <span>→</span>
              </a>

              <WhatsAppButton />
            </div>

            <p className="hero-location">
              Thoughtfully arranged in Moshi &amp; Alandi, Pune
            </p>
          </div>

          <a
            href="#catalogue"
            className="scroll-cue"
            aria-label="Scroll to catalogue"
          >
            ↓
          </a>
        </section>

        {/* DYNAMIC CATEGORY SECTIONS */}
        <div id="catalogue">
          {productsLoading ? (
            <section className="section">
              <p className="products-loading">
                Loading our beautiful collection...
              </p>
            </section>
          ) : productsError ? (
            <section className="section">
              <div className="products-message">
                <p>{productsError}</p>
                <button onClick={fetchCatalogue}>Try Again</button>
              </div>
            </section>
          ) : catalogue.length === 0 ? (
            <section className="section">
              <div className="products-message">
                <p>Our collection is being updated. Please check back soon!</p>
              </div>
            </section>
          ) : (
            catalogue.map((mainCategory, index) => (
              <section
                className={`section category-preview-section ${
                  index % 2 === 1 ? "category-preview-alt" : ""
                }`}
                id={`category-${slugify(mainCategory.name)}`}
                key={mainCategory.id}
              >
                <div className="section-heading">
                  <div>
                    <p className="eyebrow dark-eyebrow">
                      EXPLORE OUR COLLECTION
                    </p>

                    <h2>{mainCategory.name}</h2>

                    <p>
                      Discover thoughtfully created designs for every occasion.
                    </p>
                  </div>

                  <Link
                    className="text-link"
                    to={`/category/${slugify(mainCategory.name)}`}
                  >
                    View All {mainCategory.name} ↗
                  </Link>
                </div>

                <div className="product-grid">
                  {mainCategory.subcategories.map((subcategory) => {
                    const product = subcategory.products[0];

                    return (
                      <ProductCard
                        key={subcategory.id}
                        product={product}
                        category={subcategory.name}
                      />
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        {/* WHY EXOFLORA */}
        <section className="why-section" id="about">
          <div className="why-inner">
            <p className="eyebrow">THE EXOFLORA DIFFERENCE</p>
            <h2>Why ExoFlora?</h2>

            <p className="why-intro">
              More than just flowers — we help you create emotions.
            </p>

            <div className="benefit-grid">
              <article className="benefit">
                <span>❋</span>
                <h3>Fresh Flowers</h3>
                <p>Beautiful blooms selected with care.</p>
              </article>

              <article className="benefit">
                <span>❀</span>
                <h3>Thoughtful Arrangements</h3>
                <p>Designed for your special moments.</p>
              </article>

              <article className="benefit">
                <span>✧</span>
                <h3>Personal Touch</h3>
                <p>Details that make every gift meaningful.</p>
              </article>

              <article className="benefit">
                <span>♡</span>
                <h3>Customised Service</h3>
                <p>Your vision, our floral creativity.</p>
              </article>
            </div>
          </div>
        </section>

        {/* CUSTOM ORDER SECTION */}
        <section className="section custom-section" id="custom-order">
          <div className="custom-copy">
            <p className="eyebrow dark-eyebrow">MADE JUST FOR YOU</p>

            <h2>
              Your Idea.<br />
              Our Flowers.
            </h2>

            <p>
              Have something unique in mind? Tell us about your occasion,
              favourite flowers and colours. We'll discuss your custom
              arrangement with you.
            </p>

            <div className="custom-decoration">❀</div>

            <p className="small-note">
              Every occasion deserves something special.
            </p>
          </div>

          <form className="order-form" onSubmit={submitOrder}>
            <h2>Custom Order Form</h2>

            <p className="form-intro">
              Tell us what you have in mind, and let's create something beautiful.
            </p>

            <div className="form-grid">
              <label>
                Your Name *
                <input
                  name="name"
                  value={form.name}
                  onChange={updateForm}
                  placeholder="Enter your name"
                  required
                />
              </label>

              <label>
                Phone Number *
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={updateForm}
                  placeholder="Enter your number"
                  required
                  pattern="[0-9+\-\s()]{10,16}"
                />
              </label>

              <label>
                Product Type *
                <select
                  name="product"
                  value={form.product}
                  onChange={updateForm}
                >
                  <option>Bouquet</option>
                  <option>Garland</option>
                  <option>Car Decoration</option>
                  <option>Wedding Flowers</option>
                  <option>Event Decoration</option>
                  <option>Gift Hamper</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                Preferred Flowers
                <input
                  name="flowers"
                  value={form.flowers}
                  onChange={updateForm}
                  placeholder="e.g. Roses, lilies"
                />
              </label>

              <label>
                Preferred Colours
                <input
                  name="colours"
                  value={form.colours}
                  onChange={updateForm}
                  placeholder="e.g. Pink and white"
                />
              </label>

              <label>
                Budget Range
                <select
                  name="budget"
                  value={form.budget}
                  onChange={updateForm}
                >
                  <option value="">Select budget</option>
                  <option>Under ₹500</option>
                  <option>₹500–₹1,000</option>
                  <option>₹1,000–₹2,500</option>
                  <option>₹2,500–₹5,000</option>
                  <option>Above ₹5,000</option>
                  <option>Need a suggestion</option>
                </select>
              </label>

              <label>
                Required Date
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={updateForm}
                  min={new Date().toLocaleDateString("en-CA")}
                />
              </label>

              <label>
                Delivery or Pickup
                <select
                  name="delivery"
                  value={form.delivery}
                  onChange={updateForm}
                >
                  <option>Delivery</option>
                  <option>Store Pickup</option>
                  <option>Discuss with us</option>
                </select>
              </label>
            </div>

            <label className="full-field">
              Additional Instructions
              <textarea
                name="instructions"
                value={form.instructions}
                onChange={updateForm}
                placeholder="Occasion, delivery area, design ideas or other requests..."
                rows="4"
              />
            </label>

            <button className="submit-btn" type="submit">
              Send Order Enquiry on WhatsApp <span>→</span>
            </button>

            <p className="privacy-note">
              Your request opens WhatsApp so you can review and send your enquiry.
            </p>
          </form>
        </section>

        {/* REVIEWS */}
        <section className="reviews-section" id="reviews">
          <p className="eyebrow dark-eyebrow">
            KIND WORDS, BEAUTIFUL MOMENTS
          </p>

          <h2>Made Special with ExoFlora</h2>

          <p>
            Every bouquet has a story. We'd love to be a part of yours.
          </p>

          <WhatsAppButton>Plan Your Order</WhatsAppButton>
        </section>

        {/* CONTACT */}
        <section className="contact-section" id="contact">
          <div>
            <p className="eyebrow">COME SAY HELLO</p>
            <h2>Let's Make Moments Bloom.</h2>
            <p>
              Fresh flowers, thoughtful gifts and custom floral arrangements.
            </p>
          </div>

          <div className="contact-details">
            <p>
              <strong>Serving</strong>
              <br />
              Moshi &amp; Alandi, Pune
            </p>

            <p>
              <strong>Connect with us</strong>
              <br />
              For orders, availability and custom enquiries
            </p>

            <WhatsAppButton>Contact ExoFlora</WhatsAppButton>
          </div>
        </section>
      </main>

      {/* FOOTER */}
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
          <a href="/#catalogue">Our Collection</a>
          <a href="/#custom-order">Custom Orders</a>
          <a href="/#contact">Contact</a>
        </div>

        <p className="copyright">
          © {new Date().getFullYear()} ExoFlora. All rights reserved.
        </p>
      </footer>
    </>
  );
}

export default HomePage;