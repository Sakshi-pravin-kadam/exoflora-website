
import "./Hero.css";

const WHATSAPP_NUMBER = "918421941464";

const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi ExoFlora! I would like to enquire about your bouquets."
)}`;

export default function Hero() {
  return (
    <>
      <header className="exo-header">
        <a href="#home" className="exo-brand">
          <span className="exo-brand-icon">❧</span>
          <span>
            <span className="exo-brand-name">ExoFlora</span>
            <span className="exo-brand-tagline">
              FLOWERS · BOUQUETS · DECOR
            </span>
          </span>
        </a>

        <nav className="exo-nav">
          <a className="exo-active" href="#home">Home</a>
          <a href="#bouquets">Bouquets</a>
          <a href="#garlands">Car Garlands</a>
          <a href="#why-exoflora">About Us</a>
          <a href="#contact">Contact</a>
        </nav>

        <a
          className="exo-header-order"
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
        >
          <span>◉</span> Order on WhatsApp
        </a>
      </header>

      <section className="exo-hero" id="home">
        <div className="exo-hero-photo" />
        <div className="exo-hero-overlay" />

        <div className="exo-hero-content">
          <p className="exo-eyebrow">
            FRESH FLOWERS <span>•</span> FLORAL DECOR
            <span>•</span> CUSTOM ORDERS
          </p>

          <h1>
            Every Flower
            <br />
            Tells a Story
          </h1>

          <p className="exo-hero-description">
            Beautiful blooms, thoughtfully arranged
            <br className="exo-desktop-break" />
            for life’s special moments.
          </p>

          <div className="exo-hero-actions">
            <a className="exo-button exo-button-gold" href="#bouquets">
              Explore Bouquets <span>→</span>
            </a>

            <a
              className="exo-button exo-button-outline"
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
            >
              <span>◉</span> Order on WhatsApp
            </a>
          </div>
        </div>

        <a
          href="#bouquets"
          className="exo-scroll-indicator"
          aria-label="Scroll to bouquets"
        >
          ↓
        </a>
      </section>

      <div className="exo-section-heading" id="bouquets">
        <div>
          <p>MADE WITH CARE, ARRANGED WITH LOVE</p>
          <h2>Our Bouquets</h2>
          <span>Fresh, elegant flowers for every occasion.</span>
        </div>

        <a href={whatsappUrl} target="_blank" rel="noreferrer">
          Enquire about bouquets →
        </a>
      </div>
    </>
  );
}
