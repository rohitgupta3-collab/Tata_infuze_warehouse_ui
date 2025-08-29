import React from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h2>Warehouse Operations</h2>
      <div className="button-container">
        <button 
          className="button primary-button"
          onClick={() => navigate('/add-stock')}
        >
          Add Stock
        </button>
        <button 
          className="button secondary-button"
          onClick={() => navigate('/process-order')}
        >
          Process Order
        </button>
      </div>
    </div>
  );
}

export default HomePage;