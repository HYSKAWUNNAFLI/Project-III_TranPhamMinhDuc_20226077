import { useEffect, useRef, useState, type CSSProperties, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import DvdSection, { dvdTheme } from './DvdSection';
import CdSection, { cdTheme } from './CdSection';
import NewspaperSection, { newspaperTheme } from './NewspaperSection';
import BookSection, { bookTheme } from './BookSection';
import type { LandingSectionProps, LandingTheme } from './types';
import './LandingPage.css';

// Khai báo Base URL của Backend (Thay đổi port 8000 nếu cần)
const API_BASE_URL = 'http://localhost:8000/api';

type SectionConfig = {
  theme: LandingTheme;
  Component: FC<LandingSectionProps>;
};

const sections: SectionConfig[] = [
  { theme: dvdTheme, Component: DvdSection },
  { theme: cdTheme, Component: CdSection },
  { theme: newspaperTheme, Component: NewspaperSection },
  { theme: bookTheme, Component: BookSection },
];

const LandingPage = () => {
  const scrollyRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // LOGIC ĐÃ SỬA: Gửi đến API_BASE_URL/notifications/subscription-thank-you
  const handleNewsletterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Sử dụng API_BASE_URL để gọi đúng địa chỉ Backend
      const response = await fetch(`${API_BASE_URL}/notifications/subscription-thank-you`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email }), // Body khớp với Postman của bạn
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log("Email gửi thành công:", result.message);
        // Chuyển hướng sang trang cảm ơn của Frontend
        navigate('/subscription-thank-you');
      } else {
        alert("Lỗi: " + (result.message || "Không thể đăng ký"));
      }
    } catch (error) {
      console.error("Lỗi kết nối API:", error);
      alert("Không thể kết nối tới máy chủ Backend (Port 8000). Hãy kiểm tra lại Server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let frameId = 0;
    const applySnap = (value: number) => {
      const nearest = Math.round(value);
      const distance = Math.abs(value - nearest);
      const threshold = 0.25;
      if (distance >= threshold) return value;
      const eased = (distance / threshold) ** 2;
      return nearest + (value - nearest) * eased;
    };

    const updateProgress = () => {
      frameId = 0;
      if (!scrollyRef.current) return;
      const container = scrollyRef.current;
      const start = container.offsetTop;
      const total = container.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const raw = (window.scrollY - start) / total;
      const clamped = Math.min(Math.max(raw, 0), 1);
      const next = applySnap(clamped * (sections.length - 1));
      setProgress((prev) => (Math.abs(prev - next) < 0.001 ? prev : next));
    };

    const handleScroll = () => {
      if (!frameId) frameId = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  const getPanelMotion = (index: number) => {
    const offset = progress - index;
    const clamped = Math.max(-1, Math.min(1, offset));
    const translateX = clamped < 0 ? -clamped * 100 : -clamped * 30;
    const opacity = clamped < 0 ? 1 + clamped : 1 - clamped;
    const depth = Math.min(1, Math.abs(clamped));
    return { offset, clamped, translateX, opacity: Math.max(0, opacity), depth };
  };

  return (
    <main className="landing landing--scrolly">
      <div
        ref={scrollyRef}
        className="scrolly"
        style={{ '--scrolly-panels': sections.length } as CSSProperties}
      >
        <div className="scrolly__stage">
          {sections.map((section, index) => {
            const motion = getPanelMotion(index);
            const themeStyle = {
              '--theme-light': section.theme.light,
              '--theme-dark': section.theme.dark,
              '--theme-accent': section.theme.accent,
              '--theme-word': section.theme.word,
              transform: `translateX(${motion.translateX}%)`,
              opacity: motion.opacity,
              zIndex: 100 - Math.round(Math.abs(motion.offset) * 10) + (motion.offset < 0 ? 1 : 0),
              pointerEvents: Math.abs(motion.offset) < 0.6 ? 'auto' : 'none',
            } as CSSProperties;

            const SectionComponent = section.Component;

            return (
              <SectionComponent
                key={section.theme.key}
                style={themeStyle}
                heroStyle={{ transform: `translateX(${motion.clamped * 16}px)`, opacity: 1 - motion.depth * 0.2 }}
                contentStyle={{ transform: `translateX(${motion.clamped * 10}px)`, opacity: 1 - motion.depth * 0.25 }}
                scrollHint={index < sections.length - 1 ? 'Cuộn để xem chủ đề tiếp theo' : 'Cuộn xuống phần email'}
                wordStyle={{ transform: section.theme.key === 'cd' ? `translateX(-50%) translateX(${motion.clamped * 30}px) rotate(-6deg)` : `translateX(${motion.clamped * 30}px)` }}
                isActive={Math.abs(motion.offset) < 0.6}
              />
            );
          })}
        </div>
      </div>

      <section className="landing__newsletter">
        <div className="landing__newsletter-inner">
          <div>
            <p className="landing__newsletter-eyebrow">CXWUD MEDIA</p>
            <h2>Nhận email cập nhật ưu đãi mới</h2>
            <p>Gửi cho bạn các bộ sưu tập mới, ưu đãi theo mùa và gợi ý phù hợp gu nghe, gu đọc.</p>
          </div>
          <form className="landing__newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              placeholder="Email của bạn"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
            <button className="btn primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;