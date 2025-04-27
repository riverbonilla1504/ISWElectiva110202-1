// Catalog.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import Catalog from '../app/Catalog/Catalog';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Catalog Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading error when API call fails', async () => {
    // Mock axios get to reject with an error
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
    
    render(<Catalog />);
    
    expect(await screen.findByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByText('Error al cargar las comidas')).toBeInTheDocument();
  });

  test('renders food items correctly when API call succeeds', async () => {
    // Mock successful API response
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        { id: 1, name: 'Pizza Margherita', description: 'Classic pizza', price: 25000, image_url: '/pizza.jpg' },
        { id: 2, name: 'Hamburger', description: 'Delicious burger', price: 20000, image_url: '' }
      ]
    });
    
    render(<Catalog />);
    
    expect(await screen.findByTestId('foods-heading')).toBeInTheDocument();
    expect(screen.getByText('COMIDAS')).toBeInTheDocument();
    expect(screen.getByTestId('food-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('food-item-2')).toBeInTheDocument();
  });

  test('renders placeholder for missing food images', async () => {
    // Mock API response with a food item that has no image
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        { id: 2, name: 'Hamburger', description: 'Delicious burger', price: 20000, image_url: '' }
      ]
    });
    
    render(<Catalog />);
    
    // Wait for the component to finish rendering
    await waitFor(() => {
      expect(screen.getByTestId('food-name-2')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Hamburger')).toBeInTheDocument();
    expect(screen.getByTestId('food-placeholder')).toBeInTheDocument();
  });

  test('renders food images when available', async () => {
    // Mock API response with a food item that has an image
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        { id: 1, name: 'Pizza Margherita', description: 'Classic pizza', price: 25000, image_url: '/pizza.jpg' }
      ]
    });
    
    render(<Catalog />);
    
    // Wait for the component to finish rendering
    await waitFor(() => {
      expect(screen.getByTestId('food-name-1')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
    expect(screen.getByTestId('food-image')).toBeInTheDocument();
  });

  test('renders the special offers section', async () => {
    // Mock successful API response
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        { id: 1, name: 'Pizza Margherita', description: 'Classic pizza', price: 25000, image_url: '/pizza.jpg' }
      ]
    });
    
    render(<Catalog />);
    
    expect(await screen.findByTestId('offers-heading')).toBeInTheDocument();
    expect(screen.getByText('OFERTA')).toBeInTheDocument();
  });

  test('contains correct form elements for adding to cart', async () => {
    // Mock successful API response
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        { id: 1, name: 'Pizza Margherita', description: 'Classic pizza', price: 25000, image_url: '/pizza.jpg' }
      ]
    });
    
    render(<Catalog />);
    
    // Wait for the component to finish rendering
    await waitFor(() => {
      expect(screen.getByTestId('food-name-1')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
    const addToCartButtons = screen.getAllByTestId('add-to-cart-button');
    expect(addToCartButtons.length).toBeGreaterThan(0);
    
    // Check for hidden input with food ID
    const forms = document.querySelectorAll('form[action="/api/cart"]');
    expect(forms.length).toBeGreaterThan(0);
    expect(document.querySelector('input[name="foodId"]')).toBeInTheDocument();
  });
});