import { useState, type CSSProperties, type FC, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import type { LandingSectionProps } from './types';
import './NewspaperSection.css';

export const newspaperTheme = {
  key: 'newspaper',
  label: 'Newsstand',
  searchKey: 'Newspaper',
  heroWord: 'EXTRA',
  headline: 'The Daily Stories',
  description: 'Cập nhật dòng chảy tin tức mỗi sáng với phong cách tối giản.',
  accent: '#1e7fbf',
  light: '#f4f4f4',
  dark: '#111',
  word: '#e2e2e2',
};

const NewspaperSection: FC<LandingSectionProps> = ({
  style,
  heroStyle,
  wordStyle,
  isActive,
}) => {
  const papers = [
    {
      paperName: 'THE DAILY',
      issue: 'CHAPTER I',
      coverHeadline: 'CINEMA REBORN AT HOME',
      coverImage:
        'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=900&q=80',
      inner: {
        title: 'The Morning Brief',
        subtitle: 'Chương I - Màn ảnh tại gia',
        lead:
          'Chọn từng tựa DVD chuẩn màu, từng cặp cảnh âm thanh để tái tạo trải nghiệm rạp phim ngay tại nhà.',
        image:
          'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=900&q=80',
        columns: [
          'Từ phim kinh điển đến những bộ sưu tập giới hạn, mỗi tựa sắc hình và âm đều được kiểm định kỹ.',
          'Âm thanh ấm áp, phụ đề rõ ràng và chất lượng tái tạo giúp từng khoảnh khắc sống động hơn.',
        ],
        rightTitle: 'Góc biên tập',
        articles: [
          {
            title: 'Suất chiếu của tuần',
            body: 'Gợi ý 5 bộ phim kinh điển cho buổi tối cuối tuần, có kèm thông tin nhạc nền.',
          },
          {
            title: 'Bảo quản đĩa',
            body: 'Mẹo nhỏ để giữ bề mặt đĩa sạch và bền màu, tránh trầy xước không đáng có.',
          },
        ],
        promo: {
          label: 'Dành riêng cho bạn',
          offer: 'Giảm 20% bộ sưu tập phim mới',
        },
      },
    },
    {
      paperName: 'CITY EDITION',
      issue: 'CHAPTER II',
      coverHeadline: 'CITY LIGHTS, MORNING PULSE',
      coverImage:
        'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=900&q=80',
      inner: {
        title: 'Urban Dispatch',
        subtitle: 'Chương II - Nhịp sống thành phố',
        lead:
          'Khi thành phố bắt đầu thức giấc, những điểm hẹn văn hóa và âm nhạc tạo nên một ngày mới sống động.',
        image:
          'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=900&q=80',
        columns: [
          'Các sự kiện ngoài trời, triển lãm nghệ thuật và lịch chiếu đặc biệt đang được cập nhật liên tục.',
          'Những quán cà phê nhỏ giữa lòng phố cổ trở thành nơi hút bạn đọc để đọc và ghi chú.',
        ],
        rightTitle: 'Góc biên tập',
        articles: [
          {
            title: 'Đêm nhạc đường phố',
            body: 'Chương trình âm nhạc trình diễn trên các tuyến phố cũ, mở cửa từ 19:00.',
          },
          {
            title: 'Thực đơn sáng tạo',
            body: 'Những món ăn mới tối giản nhưng đầy cảm hứng, hợp với tuần năng động.',
          },
        ],
        promo: {
          label: 'Dành riêng cho bạn',
          offer: 'Tặng vé tham quan triển lãm',
        },
      },
    },
    {
      paperName: 'THE PRINT REVIEW',
      issue: 'CHAPTER III',
      coverHeadline: 'INK, PAPER, OLD TASTE',
      coverImage:
        'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=900&q=80',
      inner: {
        title: 'Ink & Memory',
        subtitle: 'Chương III - Vị giấy cổ',
        lead:
          'Văn hóa đọc báo giấy quay trở lại như một nghi thức chậm, giữ cho tâm trí biết tạm nghỉ.',
        image:
          'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=900&q=80',
        columns: [
          'Nhiều bạn đọc tìm lại cảm giác lật trang và ghi chú trực tiếp trên mặt giấy.',
          'Từ những trang tin kinh điển, ta thấy lại nét đẹp của kiểu chữ và layout thủ công.',
        ],
        rightTitle: 'Góc biên tập',
        articles: [
          {
            title: 'Bộ sưu tập cổ',
            body: 'Giới thiệu những ấn bản giới hạn, mô tả chuyện và ký ức.',
          },
          {
            title: 'Phóng viên kể chuyện',
            body: 'Một ngày tác nghiệp của phóng viên trên phố, ghi lại bằng bút mực.',
          },
        ],
        promo: {
          label: 'Dành riêng cho bạn',
          offer: 'Mua 2 tặng 1 ấn bản cổ',
        },
      },
    },
    {
      paperName: 'STUDIO NOTES',
      issue: 'CHAPTER IV',
      coverHeadline: 'DESIGNERS AT WORK',
      coverImage:
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
      inner: {
        title: 'Studio Journal',
        subtitle: 'Chương IV - Nguồn cảm hứng',
        lead:
          'Phòng làm việc của những nhà thiết kế đầy ắp ánh sáng và những ghi chú tối giản.',
        image:
          'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
        columns: [
          'Câu chuyện về cách họ phác họa ý tưởng, từ giấy nháp đến sản phẩm hoàn chỉnh.',
          'Xu hướng tối giản đang định hình các bộ sưu tập mới trong năm nay.',
        ],
        rightTitle: 'Góc biên tập',
        articles: [
          {
            title: 'Phong cách tối giản',
            body: 'Giản lược tối đa để tập trung vào trải nghiệm đọc và nhìn.',
          },
          {
            title: 'Bố cục tự do',
            body: 'Cách sắp xếp nội dung để giữ nhịp đọc tự nhiên.',
          },
        ],
        promo: {
          label: 'Dành riêng cho bạn',
          offer: 'Tải miễn phí bộ template thiết kế',
        },
      },
    },
    {
      paperName: 'WEEKEND JOURNAL',
      issue: 'CHAPTER V',
      coverHeadline: 'WEEKEND JOURNEYS',
      coverImage:
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
      inner: {
        title: 'Travel Notes',
        subtitle: 'Chương V - Chuyến đi ngắn',
        lead:
          'Một cuộc đổi nhỏ mỗi cuối tuần là đủ để nạp lại năng lượng và ghi thêm ký ức.',
        image:
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
        columns: [
          'Điểm dừng chân gần thành phố, du lịch chậm, khám phá những quán cà phê nhỏ.',
          'Mang theo một tờ báo và một chiếc bút, ghi lại những điều nhỏ nhất.',
        ],
        rightTitle: 'Góc biên tập',
        articles: [
          {
            title: 'Balo tối giản',
            body: 'Chỉ cần 5 món đồ cơ bản để bắt đầu chuyến đi nhẹ nhàng.',
          },
          {
            title: 'Lịch trình 48h',
            body: 'Gợi ý lịch trình từ sáng thứ bảy đến chiều chủ nhật.',
          },
        ],
        promo: {
          label: 'Dành riêng cho bạn',
          offer: 'Giảm 15% gói thành viên',
        },
      },
    },
    {
      paperName: 'THE COMMUNITY',
      issue: 'CHAPTER VI',
      coverHeadline: 'READERS & COMMUNITY',
      coverImage:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
      inner: {
        title: 'Readers Corner',
        subtitle: 'Chương VI - Cộng đồng độc giả',
        lead:
          'Khi câu chuyện được chia sẻ, một cộng đồng nhỏ sẽ được hình thành từ những trang báo.',
        image:
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
        columns: [
          'Độc giả gửi về những ghi chú nhỏ, chia sẻ cảm nhận về văn hóa đọc ngày nay.',
          'Mỗi tuần, chúng tôi chọn ra một câu chuyện bạn đọc tiêu biểu.',
        ],
        rightTitle: 'Góc biên tập',
        articles: [
          {
            title: 'Góp ý chủ đề mới',
            body: 'Gợi ý chủ đề, chuyên mục mà bạn muốn đọc trong số tiếp theo.',
          },
          {
            title: 'Góc thư bạn đọc',
            body: 'Những dòng thư nhỏ về khoảnh khắc đọc báo cùng gia đình.',
          },
        ],
        promo: {
          label: 'Dành riêng cho bạn',
          offer: 'Tặng kỷ niệm chương CXWUD',
        },
      },
    },
  ];
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handlePaperClick = (index: number, e: MouseEvent) => {
    e.stopPropagation();
    if (expandedIndex === index) return;
    setExpandedIndex(index);
  };

  const handleClose = (e?: MouseEvent) => {
    e?.stopPropagation();
    setExpandedIndex(null);
  };

  return (
    <section
      className={`theme theme--newspaper ${expandedIndex !== null ? 'is-reading' : ''}`}
      style={style}
    >
      <div className="np-bg-word" style={wordStyle}>
        {newspaperTheme.heroWord}
      </div>

      <div className="np-stage" style={heroStyle}>

        {/* Header ẩn đi khi đọc báo */}
        <div className={`np-header ${expandedIndex !== null ? 'fade-out' : ''}`}>
          <div className="np-eyebrow">CXWUD MEDIA · {newspaperTheme.label}</div>
          <h1 className="np-headline">{newspaperTheme.headline}</h1>
          <p className="np-subhead">{newspaperTheme.description}</p>
        </div>

        <div
          className={`np-fan-wrapper ${isActive ? 'is-fanned' : ''} ${expandedIndex !== null ? 'is-reading' : ''}`}
        >
          {papers.map((paper, index) => {
            const isExpanded = expandedIndex === index;
            const isHidden = expandedIndex !== null && !isExpanded;

            return (
              <div
                key={`${paper.issue}-${index}`}
                className={`np-card ${isExpanded ? 'is-expanded' : ''} ${isHidden ? 'is-hidden' : ''}`}
                style={{ '--i': index } as CSSProperties}
                onClick={(e) => handlePaperClick(index, e)}
              >
                {isExpanded && (
                  <button className="np-close-btn" onClick={handleClose}>
                    ✕ Đóng
                  </button>
                )}

                {/* --- BÌA BÁO (Hiện khi chưa mở) --- */}
                <div className="np-cover">
                  <div className="np-paper-head">
                    <span className="np-paper-name">{paper.paperName}</span>
                    <span className="np-paper-date">{paper.issue}</span>
                  </div>
                  <div
                    className="np-hero-img"
                    style={{ backgroundImage: `url(${paper.coverImage})` }}
                  ></div>
                  <div className="np-headline-text">{paper.coverHeadline}</div>
                  <div className="np-lines">
                    <span className="np-line" style={{ width: '100%' }}></span>
                    <span className="np-line" style={{ width: '92%' }}></span>
                    <span className="np-line" style={{ width: '96%' }}></span>
                    <span className="np-line" style={{ width: '65%' }}></span>
                  </div>
                </div>

                {/* --- NỘI DUNG ĐỌC (Hiện khi mở) --- */}
                <div className="np-inner">
                  <div className="np-page left">
                    <h2>{paper.inner.title}</h2>
                    <h3>{paper.inner.subtitle}</h3>
                    <p>{paper.inner.lead}</p>
                    <div
                      className="np-inner-img"
                      style={{ backgroundImage: `url(${paper.inner.image})` }}
                    ></div>
                    <div className="np-cols">
                      <p>{paper.inner.columns[0]}</p>
                      <p>{paper.inner.columns[1]}</p>
                    </div>
                  </div>

                  <div className="np-page right">
                    <h3>{paper.inner.rightTitle}</h3>

                    {paper.inner.articles.map((article) => (
                      <div key={article.title} className="np-article-mini">
                        <h4>{article.title}</h4>
                        <p>{article.body}</p>
                      </div>
                    ))}

                    <div className="np-ad-box">
                      <span>{paper.inner.promo.label}</span>
                      <strong>{paper.inner.promo.offer}</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={`np-actions ${expandedIndex !== null ? 'fade-out' : ''}`}>
          <Link className="np-btn-read" to={`/products?category=Newspaper`}>
            Đọc báo ngay
          </Link>
        </div>

      </div>

      <div
        className={`np-overlay ${expandedIndex !== null ? 'active' : ''}`}
        onClick={() => handleClose()}
      ></div>

      <div className="np-scroll-hint">
        <span>Cuộn xuống để xem sách</span>
        <div className="np-line-ind"></div>
      </div>
    </section>
  );
};

export default NewspaperSection;
