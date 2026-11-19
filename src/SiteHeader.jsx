
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./lib/supabase";

const WHATSAPP_NUMBER = "918421941464";

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, parent_id")
        .order("name");

      if (error) {
        console.error("Navigation categories error:", error);
        return;
      }

      const mainCategories = (data || [])
        .filter((category) => !category.parent_id)
        .map((main) => ({
          ...main,
          subcategories: (data || []).filter(
            (sub) => sub.parent_id === main.id
          ),
        }));

      setCategories(mainCategories);
    }

    fetchCategories();
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const whatsappLink =
    `https://wa.me/${WHATSAPP_NUMBER}?text=` +
    encodeURIComponent(
      "Hello ExoFlora! I would like to enquire about your flowers and arrangements."
    );

  return (
    <header className="site-header">
      <Link className="brand" to="/" onClick={closeMenu}>
        <img
          src="/images/exoflora-logo.png"
          alt="ExoFlora"
          className="brand-logo"
        />
      </Link>

      <button
        className="menu-toggle"
        onClick={() => setMenuOpen((previous) => !previous)}
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
        type="button"
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      <nav className={menuOpen ? "nav-links open" : "nav-links"}>
        <Link to="/" onClick={closeMenu}>
          Home
        </Link>

        {categories.map((category) => (
          <div className="nav-category" key={category.id}>
            <Link
              className="nav-category-main"
              to={`/category/${slugify(category.name)}`}
              onClick={closeMenu}
            >
              {category.name}
              {category.subcategories.length > 0 && (
                <span className="dropdown-arrow" aria-hidden="true">
                  ⌄
                </span>
              )}
            </Link>

            {category.subcategories.length > 0 && (
              <div className="nav-dropdown">
                {category.subcategories.map((subcategory) => (
                  <Link
                    key={subcategory.id}
                    to={`/category/${slugify(category.name)}?subcategory=${subcategory.id}`}
                    onClick={closeMenu}
                  >
                    {subcategory.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        <a href="/#about" onClick={closeMenu}>
          About Us
        </a>

        <a href="/#contact" onClick={closeMenu}>
          Contact
        </a>

        <a
          className="whatsapp-btn nav-cta"
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
        >
          <span aria-hidden="true">◉</span> Order on WhatsApp ↗
        </a>
      </nav>
    </header>
  );
}

export default SiteHeader;
