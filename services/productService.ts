
import { Product } from '../types';
import { MOCK_PRODUCTS } from '../constants';

const PRODUCTS_KEY = 'ypf_products_v1';

export const getProducts = (): Product[] => {
  const saved = localStorage.getItem(PRODUCTS_KEY);
  return saved ? JSON.parse(saved) : MOCK_PRODUCTS;
};

export const saveProducts = (products: Product[]) => {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};
