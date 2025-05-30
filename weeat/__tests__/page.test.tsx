import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Header component
jest.mock('../app/Header', () => {
  return function MockHeader() {
    return <div data-testid="header">Header Component</div>;
  };
});

// Mock Catalog component
jest.mock('../app/Catalog/Catalog', () => {
  return function MockCatalog() {
    return <div data-testid="catalog">Catalog Component</div>;
  };
});

// Import the component after mocking dependencies
const Home = require('../app/page').default;

describe('Home Page Component', () => {
  it('renders the home page with header and catalog', () => {
    render(React.createElement(Home));
    
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('catalog')).toBeInTheDocument();
  });

  it('has correct layout structure', () => {
    render(React.createElement(Home));
    
    const mainContainer = document.querySelector('.flex.flex-col.min-h-screen');
    expect(mainContainer).toBeInTheDocument();
    
    const mainContent = document.querySelector('main.flex-grow.bg-gray-50');
    expect(mainContent).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    render(React.createElement(Home));
    
    const container = document.querySelector('.flex.flex-col.min-h-screen');
    expect(container).toHaveClass('flex', 'flex-col', 'min-h-screen');
    
    const mainElement = document.querySelector('main');
    expect(mainElement).toHaveClass('flex-grow', 'bg-gray-50');
  });

  it('renders without crashing', () => {
    render(React.createElement(Home));
    expect(document.body).toBeInTheDocument();
  });
}); 