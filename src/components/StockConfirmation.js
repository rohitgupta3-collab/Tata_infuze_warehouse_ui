import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function StockConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result || null;

  if (!result) {
    // Redirect to add stock if no result data
    return (
      <div className="confirmation-container">
        <p>No stock data available. Please try again.</p>
        <button 
          className="button primary-button"
          onClick={() => navigate('/add-stock')}
        >
          Back to Add Stock
        </button>
      </div>
    );
  }

  return (
    <div className="confirmation-container">
      <h2>Stock Added Successfully</h2>
      
      <div className="confirmation-details">
        <div className="detail-row">
          <span className="detail-label">Medicine Name:</span>
          <span className="detail-value">{result.medicine_name}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Assigned Bin:</span>
          <span className="detail-value highlight">{result.bin}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Total Stock:</span>
          <span className="detail-value">{result.total_stock}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Status:</span>
          <span className="detail-value">
            {result.upserted ? 'New Item Added' : 'Existing Item Updated'}
          </span>
        </div>
      </div>
      
      <div className="next-steps">
        <h3>Next Steps</h3>
        <p>Please place the medicine in bin: <strong>{result.bin}</strong></p>
      </div>
      
      <div className="button-group">
        <button 
          className="button secondary-button"
          onClick={() => navigate('/')}
        >
          Return to Home
        </button>
        <button 
          className="button primary-button"
          onClick={() => navigate('/add-stock')}
        >
          Add More Stock
        </button>
      </div>
    </div>
  );
}

export default StockConfirmation;