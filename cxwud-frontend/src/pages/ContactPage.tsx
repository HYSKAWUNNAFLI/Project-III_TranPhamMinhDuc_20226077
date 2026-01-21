import { useState } from "react";
import "./ContactPage.css";

const ContactPage = () => {
  const [isLetterOpen, setIsLetterOpen] = useState(false);

  return (
    <main className="contact-page">
      <div className="contact-shell">
        <section className="contact-hero">
          <span className="contact-hero__tag">CXWUD Media Support</span>
          <h1>Keep the conversation moving.</h1>
          <p>
            Questions about an order, a return, or a collaboration? We answer
            every message with care and within 24 hours.
          </p>
          <div className="contact-hero__actions">
            <a className="contact-action" href="mailto:support@cxwud-store.test">
              Email Support
            </a>
            <a className="contact-action secondary" href="tel:+15551234567">
              Call Studio
            </a>
          </div>
        </section>

        <section className="contact-grid">
          <article className="contact-card contact-card--wide delay-1">
            <span className="contact-pill">Primary Desk</span>
            <h2>Customer care, always on.</h2>
            <p>
              From order tracking to returns, we keep every detail personal and
              precise.
            </p>
            <div className="contact-lines">
              <div className="contact-line">
                <strong>Email</strong>
                <span>support@cxwud-store.test</span>
              </div>
              <div className="contact-line">
                <strong>Phone</strong>
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="contact-line">
                <strong>Response</strong>
                <span>Within 24 hours</span>
              </div>
            </div>
          </article>

          <article className="contact-card delay-2">
            <span className="contact-pill">Press + Partnerships</span>
            <h2>Storytelling, together.</h2>
            <p>
              Pitch a feature, propose a partnership, or request a press kit.
            </p>
            <ul className="contact-list">
              <li>
                <strong>Press:</strong>
                <span>press@cxwud-store.com</span>
              </li>
              <li>
                <strong>Partnerships:</strong>
                <span>collab@cxwud-store.com</span>
              </li>
              <li>
                <strong>Media Kit:</strong>
                <span>Available on request</span>
              </li>
            </ul>
          </article>

          <article className="contact-card delay-3">
            <span className="contact-pill">Studio Visits</span>
            <h2>Come by the shelves.</h2>
            <p>
              We welcome curated visits and pickups. Let us know before you
              arrive.
            </p>
            <ul className="contact-list">
              <li>
                <strong>Hours:</strong>
                <span>Mon-Sat, 9:00-18:00</span>
              </li>
              <li>
                <strong>Location:</strong>
                <span>Ha Noi, Viet Nam</span>
              </li>
              <li>
                <strong>Pickup:</strong>
                <span>By appointment</span>
              </li>
            </ul>
          </article>
        </section>

        <section className="contact-letter">
          <div className="contact-letter__intro">
            <h2>A small letter for our readers.</h2>
            <p>
              Tap the envelope to unfold a thank-you note from the CXWUD team.
            </p>
            <p className="contact-letter__hint">
              {isLetterOpen ? "Tap to close the letter" : "Tap to open the letter"}
            </p>
          </div>

          <button
            className={`envelope ${isLetterOpen ? "is-open" : ""}`}
            type="button"
            aria-expanded={isLetterOpen}
            aria-label="Toggle thank you letter"
            onClick={() => setIsLetterOpen((prev) => !prev)}
          >
            <span className="envelope__shadow" aria-hidden="true" />
            <span className="envelope__back" aria-hidden="true" />
            <span className="envelope__paper">
              <h3>Thank you.</h3>
              <p>
                Cảm ơn bạn đã tin tưởng CXWUD. Mỗi đơn hàng là động lực để chúng
                tôi tiếp tục tuyển chọn những tác phẩm sách, đĩa, và Tạp chí mà bạn
                yêu thích.
              </p>
              <span>CXWUD Team</span>
            </span>
            <span className="envelope__front" aria-hidden="true" />
            <span className="envelope__flap" aria-hidden="true" />
            <span className="envelope__seal" aria-hidden="true">
              CXWUD
            </span>
          </button>
        </section>
      </div>
    </main>
  );
};

export default ContactPage;
