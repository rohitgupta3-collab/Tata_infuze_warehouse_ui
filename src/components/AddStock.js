import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AddStock() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: '',
    count: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'count' ? parseInt(value) || 0 : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:8000/assign-bin', formData);
      // Navigate to confirmation page with response data
      navigate('/stock-confirmation', { state: { result: response.data } });
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred while adding stock');
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    // Mock QR scanning - in a real app, you would integrate a QR scanner
    // For demo purposes, we'll just populate with sample data
    setFormData({
      id: 'MED' + Math.floor(Math.random() * 1000),
      name: 'Paracetamol',
      category: 'analgesic',
      count: 1
    });
  };

  return (
    <div className="form-container">
      <h2>Add Stock</h2>
      <button className="button scan-button" onClick={handleScanQR}>
        Scan QR Code
      </button>
      <p className="or-separator">OR</p>
      
      <form onSubmit={handleSubmit}>
        {/* <div className="form-group">
          <label htmlFor="id">Medicine ID</label>
          <input
            type="text"
            id="id"
            name="id"
            value={formData.id}
            onChange={handleChange}
            required
          />
        </div> */}
        
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        {/* <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            <option value="analgesic">Analgesic</option>
            <option value="antibiotic">Antibiotic</option>
            <option value="vaccine">Vaccine</option>
            <option value="controlled">Controlled Substance</option>
          </select>
        </div> */}
        
        <div className="form-group">
          <label htmlFor="count">Count</label>
          <input
            type="number"
            id="count"
            name="count"
            min="1"
            value={formData.count}
            onChange={handleChange}
            required
          />
        </div>
        
        {error && <p className="error-message">{error}</p>}
        
        <div className="button-group">
          <button 
            type="button" 
            className="button secondary-button"
            onClick={() => navigate('/')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="button primary-button"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Add Stock'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddStock;