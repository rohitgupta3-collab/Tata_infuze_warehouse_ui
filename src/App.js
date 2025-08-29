import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import AddStock from './components/AddStock';
import StockConfirmation from './components/StockConfirmation';
import ProcessOrder from './components/ProcessOrder';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>Warehouse Management System</h1>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/add-stock" element={<AddStock />} />
            <Route path="/stock-confirmation" element={<StockConfirmation />} />
            <Route path="/process-order" element={<ProcessOrder />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <p>© 2025 Warehouse Management System</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;