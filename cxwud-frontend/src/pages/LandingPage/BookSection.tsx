import { useState, type FC, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import type { LandingSectionProps } from './types';
import './BookSection.css';

// Dữ liệu nội dung (giữ nguyên theme cổ điển)
export const bookTheme = {
  key: 'book',
  headline: 'Kho tàng tri thức',
  intro: 'Chương I · Thư viện CXWUD',
  description: 'Những trang sách nhuốm màu thời gian, được tuyển chọn để đọc chậm và sâu.',
  reading: [
    'Mỗi tựa sách là một lối mở — từ kinh điển đến đương đại, từ hoài niệm đến khám phá.',
    'Giấy mịn, bìa đẹp, typography tinh tế. Mở trang đầu tiên, để câu chữ dẫn lối.'
  ],
  metrics: [
    { value: '20+', label: 'Tựa sách' },
    { value: '4 loại', label: 'Chủ đề' },
    { value: '24h', label: 'Giao ngay' },
  ],
  badges: ['Bìa cứng & mềm', 'Tác phẩm kinh điển', 'Ấn bản giới hạn'],
  quickLinks: [
    { short: 'Khắp', url: '/products?cat=explore' },
    { short: 'Xem', url: '/products?cat=view' },
  ],
  accent: "#e53935", 
  light: "#ffffff",  
  dark: "#1a1a1a",  
  word: "#333333",
};

const InteractiveBigBook = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [noteStates, setNoteStates] = useState({ note1: false, note2: false });
  const [penActive, setPenActive] = useState(false);

  const toggleBook = () => setIsOpen(!isOpen);
  const closeBook = (e: MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  // Ngăn chặn nổi bọt sự kiện khi click vào link bên trong
  const stopProp = (e: MouseEvent) => e.stopPropagation();

  return (
    <div className="book-scene">
      <div className="desk-items" aria-hidden="true">
        <button
          type="button"
          className={`desk-note note-1 ${noteStates.note1 ? 'is-open' : ''}`}
          onClick={() => setNoteStates(prev => ({ ...prev, note1: !prev.note1 }))}
          aria-pressed={noteStates.note1}
        >
          <span className="note-pin"></span>
          <span className="note-title">Ghi chú</span>
          <span className="note-body">Chào mừng bạn đến với “Kho tàng tri thức”.</span>
          <span className="note-meta">Chạm để xem</span>
        </button>

        <button
          type="button"
          className={`desk-note note-2 ${noteStates.note2 ? 'is-open' : ''}`}
          onClick={() => setNoteStates(prev => ({ ...prev, note2: !prev.note2 }))}
          aria-pressed={noteStates.note2}
        >
          <span className="note-pin"></span>
          <span className="note-title">Gạch chân</span>
          <span className="note-body">“Đọc chậm, nhớ lâu.”</span>
          <span className="note-meta">Chạm để lật</span>
        </button>

        <button
          type="button"
          className={`desk-pen pen-1 ${penActive ? 'is-active' : ''}`}
          onClick={() => setPenActive(prev => !prev)}
          aria-pressed={penActive}
        >
          <span className="pen-cap"></span>
          <span className="pen-body"></span>
          <span className="pen-tip"></span>
        </button>

        <button type="button" className="desk-pencil pencil-1" aria-label="Bút chì">
          <span className="pencil-body"></span>
          <span className="pencil-tip"></span>
        </button>
      </div>

      <div
        className={`grand-grim-book ${isOpen ? 'is-open' : ''}`}
        onClick={toggleBook}
      >
        {/* === PHẦN BÌA TRƯỚC (Sẽ lật ra) === */}
        <div className="book-cover-group">

          {/* Mặt tiền (Bìa da bên ngoài) */}
          <div className="cover-face front-leather">
            <div className="leather-texture"></div>
            <div className="gold-border">
              <span className="cover-est">EST. 2025</span>
              <h1 className="cover-title">THE<br />CXWUD</h1>
              <div className="cover-ornament">✻</div>
              <span className="cover-subtitle">CLASSIC EDITION</span>
            </div>
            <div className="spine-fold"></div>
            {!isOpen && <div className="click-hint">Click để mở sách</div>}
          </div>

          {/* Mặt hậu của bìa trước (Chính là TRANG TRÁI khi mở ra) */}
          <div className="cover-face back-paper">
            <div className="page-content-left" onClick={stopProp}>
              <div className="vintage-eyebrow">CXWUD MEDIA</div>
              <div className="chapter-kicker">{bookTheme.intro}</div>
              <h2 className="vintage-headline">{bookTheme.headline}</h2>
              <div className="headline-separator">~ ✻ ~</div>
              <p className="vintage-description">{bookTheme.description}</p>
              <div className="reading-body">
                {bookTheme.reading.map((text, index) => (
                  <p
                    key={text}
                    className={`reading-paragraph ${index === 0 ? 'is-dropcap' : ''}`}
                  >
                    {text}
                  </p>
                ))}
              </div>

              <div className="vintage-actions">
                <Link className="stamp-btn primary-stamp" to="/products?category=Book">
                  Khám phá
                </Link>
                <Link className="stamp-btn secondary-stamp" to="/products">
                  Tất cả
                </Link>
              </div>
              <div className="corner-decor bottom-left"></div>
            </div>
          </div>
        </div>

        {/* === PHẦN THÂN SAU (Cố định, chứa TRANG PHẢI) === */}
        <div className="book-back-group">
          <div className="page-content-right" onClick={stopProp}>
            {/* Layout theo bản vẽ tay của bạn */}
            <div className="sketch-layout">
              {/* Cột tiêu đề dọc */}
              

              {/* Cột nội dung chính */}
              <div className="main-col">
                {/* Hàng nút nhỏ (khắp, xem) */}
                <div className="page-controls">
                  <div className="top-tags-row">
                    {bookTheme.quickLinks.map(l => (
                      <Link key={l.short} to={l.url} className="sketch-tag">{l.short}</Link>
                    ))}
                  </div>
                  {isOpen && (
                    <button type="button" className="book-close" onClick={closeBook}>
                      Đóng sách
                    </button>
                  )}
                </div>

                {/* Các khối nội dung lớn (Metrics & Badges) */}
                <div className="big-blocks-area">
                  {/* Block Metrics */}
                  <div className="sketch-box metrics-box">
                    {bookTheme.metrics.map(m => (
                      <div key={m.label} className="metric-mini">
                        <b>{m.value}</b>
                        <small>{m.label}</small>
                      </div>
                    ))}
                  </div>

                  {/* Block Badges */}
                  <div className="sketch-box badges-box">
                    {bookTheme.badges.map(b => (
                      <span key={b} className="badge-line">{b}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="corner-decor top-right"></div>
          </div>

          {/* Độ dày của trang sách (Giả lập tập giấy) */}
          <div className="book-thickness-side"></div>
          <div className="book-thickness-bottom"></div>
        </div>

      </div>
    </div>
  );
};

const BookSection: FC<LandingSectionProps> = ({ style, scrollHint }) => {
  return (
    <section className="vintage-book-section" style={style}>
      <div className="wood-table-bg"></div>
      <InteractiveBigBook />

      <div className="theme__scroll-hint vintage-hint">
        <span>{scrollHint}</span>
        <div className="theme__scroll-indicator"><span></span></div>
      </div>
    </section>
  );
};

export default BookSection;
