import type { FC } from 'react';
import { Link } from 'react-router-dom';
import dvdVideo from '../../assets/avenger.mp4';
import './DvdSection.css';
import type { LandingSectionProps } from './types';

export const dvdTheme = {
  key: 'dvd',
  label: 'DVD Collection',
  searchKey: 'DVD',
  // Màu accent mới: Sunset Gold pha Red
  accent: '#ff5e3a',
  light: '#fff',
  dark: '#0b0b0b',
  word: '#222',
};

const dvdMetrics = [
  { value: '120+', label: 'Tựa phim' },
  { value: '4K', label: 'Remaster' },
  { value: 'ATMOS', label: 'Surround' },
];

const DvdSection: FC<LandingSectionProps> = ({ style, heroStyle, scrollHint }) => {
  return (
    <section className="theme theme--dvd immersive-cinema" style={style}>
      {/* Background Layer */}
      <div className="cinema-bg" aria-hidden="true">
        <video
          className="cinema-video"
          src={dvdVideo}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        />
        <div className="cinema-overlay"></div>
        <div className="cinema-spotlight"></div>
      </div>

      {/* Content Layer */}
      <div className="cinema-hero" style={heroStyle}>
        <div className="cinematic-content">
          <div className="cinema-eyebrow">
            <span className="eyebrow-line"></span>
            CXWUD MEDIA · {dvdTheme.label}
          </div>

          <h1 className="cinematic-title">
            Cinema <br />
            At <span className="text-highlight">Home</span>
          </h1>

          <p className="cinematic-desc">
            Sắc màu rực rỡ, phụ đề chuẩn xác và soundtrack ấm áp.
            Trải nghiệm rạp chiếu ngay tại phòng khách với bộ sưu tập DVD & Blu-ray chất lượng cao.
          </p>

          <div className="cinematic-stats">
            {dvdMetrics.map((metric, index) => (
              <div key={index} className="stat-item">
                <span className="stat-value">{metric.value}</span>
                <span className="stat-label">{metric.label}</span>
              </div>
            ))}
          </div>

          <div className="cinema-actions">
            <Link
              className="btn-magnetic primary"
              to={`/products?category=DVD`}
            >
              <span>Khám phá ngay</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link className="btn-magnetic secondary" to="/products">
              Xem tất cả
            </Link>
          </div>
        </div>

        {/* Visual Layer - 3D Composition */}
        <div className="cinematic-visual">
          {/* Background Decor Text */}
          <div className="big-text-bg">DVD</div>

          <div className="disc-wrapper">
            {/* Vỏ đĩa mờ phía sau */}
            <div className="disc-case-blur"></div>

            {/* Đĩa 3D xoay */}
            <div className="disc-3d-container">
              <div className="disc-3d">
                <div className="disc-texture"></div>
                <div className="disc-reflection"></div>
                <div className="disc-center">
                  <div className="disc-hole"></div>
                  <span className="brand">CXWUD</span>
                </div>
              </div>
            </div>

            {/* Floating Cards (Tech specs) */}
            <div className="tech-card card-dolby">
              <div className="tech-icon"></div>
              <div className="tech-info">
                <strong>Dolby Vision</strong>
                <span>HDR Tối ưu</span>
              </div>
            </div>
            <div className="tech-card card-bluray">
              <div className="tech-info">
                <strong>Blu-ray™</strong>
                <span>Official</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="theme__scroll-hint">
        <span>{scrollHint}</span>
        <div className="scroll-line"></div>
      </div>
    </section>
  );
};

export default DvdSection;
