import { useEffect, useRef, useState, type FC, type MouseEvent, type TouchEvent } from 'react';
import { Link } from 'react-router-dom';
import justTheTwoOfUs from '../../assets/Just The Two Of Us.mp3';
import type { LandingSectionProps } from './types';
import './CdSection.css';

export const cdTheme = {
  key: 'vinyl',
  label: 'Vinyl Collection',
  searchKey: 'Vinyl',
  accent: '#d4af37',
  light: '#fff',
  dark: '#0b0b0b',
  word: '#222',
};

const CdSection: FC<LandingSectionProps> = ({ style, heroStyle, scrollHint, isActive }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isArmMoving, setIsArmMoving] = useState(false); // Trạng thái cần đang di chuyển

  const audioRef = useRef<HTMLAudioElement>(null);
  const discRef = useRef<HTMLDivElement>(null);
  const lastAngle = useRef<number>(0);
  const armTimeoutRef = useRef<number | null>(null);

  // Xử lý sự kiện Audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
      setIsArmMoving(false);
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  // Tự động tắt khi cuộn sang section khác
  useEffect(() => {
    if (!isActive && isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsArmMoving(false);
    }
  }, [isActive, isPlaying]);

  // Cleanup timeout khi component unmount
  useEffect(() => {
    return () => {
      if (armTimeoutRef.current) clearTimeout(armTimeoutRef.current);
    };
  }, []);

  const togglePlay = () => {
    // Chặn tương tác nếu đang tua hoặc cần đang di chuyển
    if (isScrubbing || isArmMoving) return;

    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      // --- QUY TRÌNH BẬT MÁY ---
      // 1. Kích hoạt trạng thái di chuyển cần
      setIsArmMoving(true);

      // 2. Đợi 1 giây (để animation di chuyển cần chạy xong) rồi mới phát nhạc
      armTimeoutRef.current = window.setTimeout(() => {
        audio.play()
          .then(() => {
            setIsPlaying(true);
            setIsArmMoving(false); // Kết thúc di chuyển, chuyển sang trạng thái Active
          })
          .catch(e => {
            console.error("Audio playback failed:", e);
            setIsArmMoving(false);
          });
      }, 1000); // Thời gian này khớp với animation-duration trong CSS

    } else {
      // --- QUY TRÌNH TẮT MÁY ---
      if (armTimeoutRef.current) clearTimeout(armTimeoutRef.current);
      audio.pause();
      setIsPlaying(false);
      // Khi isPlaying = false, CSS transition sẽ tự đưa cần về chỗ cũ
    }
  };

  // --- LOGIC TUA NHẠC (SCRUBBING) ---
  const getAngle = (clientX: number, clientY: number) => {
    if (!discRef.current) return 0;
    const rect = discRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(clientY - centerY, clientX - centerX);
  };

  const startScrub = (e: MouseEvent | TouchEvent) => {
    // Chỉ cho phép tua khi nhạc ĐANG PHÁT (kim đã hạ xuống)
    if (!isPlaying || isArmMoving) return;

    setIsScrubbing(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    lastAngle.current = getAngle(clientX, clientY);
  };

  const doScrub = (e: MouseEvent | TouchEvent) => {
    if (!isScrubbing || !audioRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    const currentAngle = getAngle(clientX, clientY);
    let delta = currentAngle - lastAngle.current;

    // Xử lý góc xoay qua mốc 0
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;

    // Hệ số tua: 1 vòng = 30 giây
    const timeChange = (delta / (2 * Math.PI)) * 30;

    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + timeChange);
    lastAngle.current = currentAngle;
  };

  const endScrub = () => {
    setIsScrubbing(false);
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  return (
    <section
      className="theme theme--cd dark-vinyl-lounge"
      style={style}
      onMouseMove={(e) => isScrubbing && doScrub(e)}
      onMouseUp={endScrub}
      onTouchMove={(e) => isScrubbing && doScrub(e)}
      onTouchEnd={endScrub}
    >
      <div className="vignette-overlay"></div>

      <div className="vinyl-container" style={heroStyle}>

        <div className="vinyl-header">
          <div className="vinyl-eyebrow">CXWUD VINTAGE AUDIO</div>
          <h1 className="vinyl-title">Explore your music</h1>
        </div>

        <div className="turntable-unit">
          {/* Nắp máy */}
          <div className="dust-cover-hint"></div>

          {/* Bề mặt máy */}
          <div className="turntable-surface">

            {/* CẦN ĐỌC (TONEARM) */}
            <div
              className={`tonearm-assembly ${isPlaying ? 'arm-active' : ''} ${isArmMoving ? 'arm-moving' : ''}`}
            >
              <div className="pivot-base"></div>
              <div className="arm-rod">
                <div className="counterweight"></div>
              </div>
              <div className="headshell">
                <div className="cartridge"></div>
              </div>
            </div>

            {/* MÂM ĐĨA & ĐĨA THAN */}
            <div className="platter-base">
              <div
                ref={discRef}
                className={`vinyl-record ${isPlaying && !isScrubbing ? 'spinning' : ''}`}
                onMouseDown={startScrub}
                onTouchStart={startScrub}
                title={isPlaying ? "Giữ chuột và xoay để tua" : "Vui lòng bật nhạc trước"}
                style={{ cursor: isPlaying ? 'grab' : 'default' }}
              >
                <div className="vinyl-grooves"></div>
                <div className="vinyl-reflection"></div>
                <div className="vinyl-label">
                  <span className="label-top">STEREO</span>
                  <strong className="label-song">Two of Us</strong>
                  <span className="label-artist">Grover W. Jr</span>
                </div>
                <div className="spindle"></div>
              </div>
            </div>

            {/* Cụm điều khiển mặt trên */}
            <div className="control-cluster">
              <div className="speed-switch">
                <span>33</span>
                <div className="switch-knob"></div>
                <span>45</span>
              </div>
              <div
                className="power-light"
                style={{
                  opacity: isPlaying || isArmMoving ? 1 : 0.3,
                  boxShadow: isPlaying ? '0 0 8px #ff4d4d' : 'none'
                }}
              ></div>
            </div>
          </div>

          {/* Thân máy & Loa */}
          <div className="turntable-body-front">
            <div className="speaker-mesh"></div>
            <div className="front-controls">
              <div
                className="volume-knob"
                onClick={togglePlay}
                title={isPlaying ? "Tắt nhạc" : "Bật nhạc"}
                style={{ cursor: isArmMoving ? 'wait' : 'pointer' }}
              >
                <div
                  className="knob-line"
                  style={{ transform: isPlaying || isArmMoving ? 'rotate(140deg)' : 'rotate(0deg)' }}
                ></div>
              </div>
              <span className="knob-label">VOLUME / POWER</span>
            </div>
          </div>
        </div>

        <div className="vinyl-footer">
          <Link className="gold-link" to="/products?category=CD">Khám Phá CD Của Bạn</Link>
        </div>

      </div>

      <audio ref={audioRef} src={justTheTwoOfUs} preload="auto" loop />

      <div className="theme__scroll-hint gold-hint">
        <span>{scrollHint}</span>
        <div className="scroll-line-gold"></div>
      </div>
    </section>
  );
};

export default CdSection;