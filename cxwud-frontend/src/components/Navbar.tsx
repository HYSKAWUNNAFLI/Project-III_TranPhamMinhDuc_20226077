import type { FC, FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Layout.css';
import { useCart } from '../context/CartContext';

type ThemeMode = 'light' | 'dark';

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem('aims-theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
};

const Navbar: FC = () => {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = searchValue.trim();
    if (!term) {
      return;
    }
    navigate(`/products?query=${encodeURIComponent(term)}`);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('aims-theme', theme);
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <nav className="nav">
      <div className="nav__logo">
        <Link to="/home">CXWUD MEDIA</Link>
      </div>
      <div className="nav__links">
        <Link to="/home">Home</Link>
        <Link to="/products">Shop</Link>
        <Link to="/contact">Contact</Link>
      </div>
      <div className="nav__actions">
        <div className="nav__search">
          <span className="nav__search-trigger">Search</span>
          <form className="nav__search-panel" onSubmit={handleSearchSubmit}>
            <label className="nav__search-field">
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Enter keyword"
              />
            </label>
            <button className="nav__search-submit" type="submit" aria-label="Search">
              →
            </button>
          </form>
        </div>
        <button
          className="nav__theme-toggle"
          type="button"
          onClick={handleThemeToggle}
          aria-pressed={theme === 'dark'}
          aria-label="Toggle light and dark mode"
        >
          {theme === 'dark' ? 'Dark' : 'Light'} Mode
        </button>
        <Link className="nav__cart" to="/cart">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l1.68 10.06a2 2 0 0 0 2 1.69h7.72a2 2 0 0 0 2-1.69l.6-4.06H6" />
          </svg>
          <span>Cart ({totalItems})</span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
