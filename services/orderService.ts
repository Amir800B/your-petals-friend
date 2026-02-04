
import { Order, OrderStatus } from '../types';

const ORDERS_KEY = 'ypf_orders_v1';

export const getOrders = (): Order[] => {
  const saved = localStorage.getItem(ORDERS_KEY);
  return saved ? JSON.parse(saved) : [];
};

export const createOrder = (orderData: Partial<Order>): Order => {
  const orders = getOrders();
  const newOrder: Order = {
    id: Math.random().toString(36).substr(2, 9),
    customer_name: orderData.customer_name || '',
    phone: orderData.phone || '',
    product_name: orderData.product_name || 'Custom',
    product_id: orderData.product_id || 'custom',
    quantity: orderData.quantity || 1,
    address: orderData.address || '',
    delivery_date: orderData.delivery_date || '',
    delivery_time: orderData.delivery_time || '',
    notes: orderData.notes || '',
    status: OrderStatus.PENDING,
    createdAt: new Date().toISOString(),
  };
  
  const updated = [newOrder, ...orders];
  localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
  return newOrder;
};

export const updateOrderStatus = (id: string, status: OrderStatus) => {
  const orders = getOrders();
  const updated = orders.map(o => o.id === id ? { ...o, status } : o);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
};

export const deleteOrder = (id: string) => {
  const orders = getOrders();
  const updated = orders.filter(o => o.id !== id);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
};
