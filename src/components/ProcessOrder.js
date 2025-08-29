import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function ProcessOrder() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderResults, setOrderResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Collection state
  const [collectingItems, setCollectingItems] = useState({});
  const [collectedItems, setCollectedItems] = useState({});
  
  // Delete order state
  const [deletingOrder, setDeletingOrder] = useState(false);

  // Picker color state
  const [pickerColor, setPickerColor] = useState(null);

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('http://localhost:8000/orders');
      setOrders(response.data.orders || []);
    } catch (err) {
      setError('Failed to fetch orders: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setOrdersLoading(false);
    }
  };

  // Helper function to get order items regardless of data structure
  const getOrderItems = (order) => {
    if (order.items && Array.isArray(order.items)) {
      return order.items; // New format with detailed items
    } else if (order.medicine_names && Array.isArray(order.medicine_names)) {
      // Old format - convert medicine_names to items format
      return order.medicine_names.map(name => ({
        name: name,
        medicine_name: name,
        quantity: 1 // Default quantity since it's not specified
      }));
    }
    return []; // Fallback empty array
  };

  // Helper function to get items count
  const getItemsCount = (order) => {
    const items = getOrderItems(order);
    return items.length;
  };

  const handleOrderSelect = async (order) => {
    setSelectedOrder(order);
    setLoading(true);
    setError(null);
    setOrderResults([]);
    setCollectingItems({});
    setCollectedItems({});
    setPickerColor(null);

    try {
      const orderItems = getOrderItems(order);
      // Call receive-order API with order_id as path parameter
      const response = await axios.post(`http://localhost:8000/receive-order/${order._id}`, orderItems);
      setOrderResults(response.data.results);
      setPickerColor(response.data.picker_color);
    } catch (err) {
      if (err.response?.status === 503) {
        setError('All pickers are busy. Please wait and try again.');
      } else {
        setError('Failed to process order: ' + (err.response?.data?.detail || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCollectItem = async (itemResult, orderItem) => {
    if (itemResult.status !== 'ok') return;

    const itemKey = `${itemResult.name}-${orderItem.quantity}`;
    setCollectingItems(prev => ({ ...prev, [itemKey]: true }));
    setError(null);

    try {
      const collectData = {
        medicine_name: itemResult.name,
        quantity: orderItem.quantity
      };

      const response = await axios.post('http://localhost:8000/collect-medicine', collectData);
      
      // Mark item as collected
      setCollectedItems(prev => ({ 
        ...prev, 
        [itemKey]: {
          name: response.data.name,
          collected: response.data.collected,
          bin: itemResult.bin,
          picker: itemResult.picker
        }
      }));

    } catch (err) {
      setError(`Failed to collect ${itemResult.name}: ${err.response?.data?.detail || 'Unknown error'}`);
    } finally {
      setCollectingItems(prev => ({ ...prev, [itemKey]: false }));
    }
  };

  const handleCompleteAndDeleteOrder = async () => {
    if (!selectedOrder) return;

    setDeletingOrder(true);
    setError(null);

    try {
      // Delete order - this will automatically turn off LEDs and free the picker color
      const response = await axios.delete(`http://localhost:8000/orders/${selectedOrder._id}`);
      
      // Show success message briefly
      alert(`Order ${selectedOrder._id} completed and deleted successfully! LEDs turned off and picker color freed.`);
      
      // Refresh orders list and go back to orders view
      await fetchOrders();
      resetOrderProcessing();
      
    } catch (err) {
      setError(`Failed to delete order: ${err.response?.data?.detail || 'Unknown error'}`);
    } finally {
      setDeletingOrder(false);
    }
  };

  const resetOrderProcessing = () => {
    setSelectedOrder(null);
    setOrderResults([]);
    setCollectingItems({});
    setCollectedItems({});
    setError(null);
    setPickerColor(null);
  };

  const isOrderComplete = () => {
    if (!orderResults.length) return false;
    const okItems = orderResults.filter(item => item.status === 'ok');
    const collectedCount = Object.keys(collectedItems).length;
    return okItems.length > 0 && collectedCount === okItems.length;
  };

  // Show top 5 orders and count of remaining
  const displayOrders = orders.slice(0, 5);
  const remainingCount = orders.length > 5 ? orders.length - 5 : 0;

  // If an order is selected, show the order processing view
  if (selectedOrder) {
    const selectedOrderItems = getOrderItems(selectedOrder);
    
    return (
      <div className="order-container">
        <div className="order-header">
          <div className="order-title">
            <h2>Processing Order: {selectedOrder._id}</h2>
            {pickerColor && (
              <div className="picker-info">
                <span className="picker-badge" style={{backgroundColor: pickerColor}}>
                  Picker: {pickerColor}
                </span>
              </div>
            )}
          </div>
          <button 
            className="button secondary-button"
            onClick={resetOrderProcessing}
          >
            ← Back to Orders
          </button>
        </div>

        {loading && <p>Validating order items and assigning picker...</p>}
        {error && <p className="error-message">{error}</p>}

        {orderResults.length > 0 && (
          <div className="order-items-processing">
            <h3>Order Items</h3>
            {pickerColor && (
              <div className="picker-instructions">
                <p><strong>🔆 LEDs are now ON with color: {pickerColor}</strong></p>
                <p>Follow the {pickerColor} LEDs to locate items in the warehouse.</p>
              </div>
            )}
            {orderResults.map((itemResult, index) => {
              const orderItem = selectedOrderItems[index];
              const itemKey = `${itemResult.name}-${orderItem.quantity}`;
              const isCollected = collectedItems[itemKey];
              const isCollecting = collectingItems[itemKey];

              return (
                <div key={index} className={`order-item-card ${itemResult.status}`}>
                  <div className="item-info">
                    <h4>{itemResult.name}</h4>
                    <p>Quantity: {orderItem.quantity}</p>
                    
                    {itemResult.status === 'ok' && (
                      <div className="bin-info">
                        <p className="bin-location">
                          <strong>Bin Location: {itemResult.bin}</strong>
                        </p>
                        {itemResult.picker && (
                          <p className="picker-color">
                            LED Color: <span style={{color: itemResult.picker, fontWeight: 'bold'}}>
                              {itemResult.picker}
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                    
                    {itemResult.status === 'not_found' && (
                      <p className="status-error">❌ Medicine not found</p>
                    )}
                    
                    {itemResult.status === 'insufficient_stock' && (
                      <p className="status-error">
                        ⚠️ Insufficient stock (Available: {itemResult.available})
                      </p>
                    )}
                  </div>

                  <div className="item-actions">
                    {itemResult.status === 'ok' && !isCollected && (
                      <button
                        className="button collect-button"
                        onClick={() => handleCollectItem(itemResult, orderItem)}
                        disabled={isCollecting}
                      >
                        {isCollecting ? 'Collecting...' : 'Collect Item'}
                      </button>
                    )}

                    {isCollected && (
                      <div className="collected-status">
                        <p className="status-success">✅ Collected</p>
                        <p>From: {isCollected.bin}</p>
                        {isCollected.picker && (
                          <p>LED: {isCollected.picker}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isOrderComplete() && (
          <div className="order-complete">
            <h3>🎉 Order Processing Complete!</h3>
            <p>All available items have been collected for order {selectedOrder._id}</p>
            {pickerColor && (
              <p className="led-warning">
                <strong>⚠️ Remember:</strong> Completing this order will turn OFF all {pickerColor} LEDs and free the picker color.
              </p>
            )}
            <div className="order-complete-actions">
              <button 
                className="button primary-button complete-delete-btn"
                onClick={handleCompleteAndDeleteOrder}
                disabled={deletingOrder}
              >
                {deletingOrder ? 'Completing Order...' : 'Complete & Delete Order'}
              </button>
              <button 
                className="button secondary-button"
                onClick={resetOrderProcessing}
                disabled={deletingOrder}
              >
                Keep Order & Go Back
              </button>
            </div>
          </div>
        )}

        <div className="button-group">
          <button 
            className="button secondary-button"
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Default view - show orders list
  return (
    <div className="order-container">
      <h2>Process Orders</h2>
      
      {ordersLoading && <p>Loading orders...</p>}
      {error && <p className="error-message">{error}</p>}
      
      {!ordersLoading && orders.length === 0 && (
        <div className="no-orders">
          <p>No orders found to process.</p>
          <button 
            className="button primary-button"
            onClick={fetchOrders}
          >
            Refresh Orders
          </button>
        </div>
      )}

      {!ordersLoading && orders.length > 0 && (
        <div className="orders-list">
          <div className="orders-header">
            <h3>Pending Orders ({orders.length})</h3>
            <button 
              className="button secondary-button refresh-btn"
              onClick={fetchOrders}
            >
              Refresh
            </button>
          </div>
          
          {displayOrders.map((order) => {
            const itemsCount = getItemsCount(order);
            const orderItems = getOrderItems(order);
            
            return (
              <div key={order._id} className="order-card">
                <div className="order-info">
                  <h4>Order #{order._id}</h4>
                  {order.customer_name && (
                    <p><strong>Customer:</strong> {order.customer_name}</p>
                  )}
                  <p><strong>Items:</strong> {itemsCount} medicine(s)</p>
                  {order.total_amount && (
                    <p><strong>Total Amount:</strong> ${order.total_amount}</p>
                  )}
                  <p><strong>Status:</strong> {order.status || 'Pending'}</p>
                  <div className="order-items-preview">
                    {orderItems.map((item, index) => (
                      <span key={index} className="item-tag">
                        {item.name || item.medicine_name} {item.quantity && `(x${item.quantity})`}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  className="button primary-button"
                  onClick={() => handleOrderSelect(order)}
                >
                  Process Order
                </button>
              </div>
            );
          })}
          
          {remainingCount > 0 && (
            <div className="more-orders">
              <p>+ {remainingCount} more orders pending</p>
            </div>
          )}
        </div>
      )}

      <div className="button-group">
        <button 
          className="button secondary-button"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default ProcessOrder;