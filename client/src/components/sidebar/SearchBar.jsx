import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchBar = ({ value, onChange, onClear }) => {
  return (
    <div className="search-container">
      <div className="search-input-box">
        <Search size={18} color="var(--text-secondary)" />
        <input
          type="text"
          placeholder="Search or start new chat"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button
            type="button"
            className="icon-btn"
            style={{ width: '22px', height: '22px' }}
            onClick={onClear}
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
