import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/font/google with all the fonts used in layout
jest.doMock('next/font/google', () => ({
  Geist: jest.fn(() => ({
    variable: '--font-geist-sans',
    className: 'geist-sans'
  })),
  Geist_Mono: jest.fn(() => ({
    variable: '--font-geist-mono',
    className: 'geist-mono'
  })),
  Poppins: jest.fn(() => ({
    variable: '--font-poppins',
    className: 'poppins'
  }))
}));

// Mock CSS imports
jest.doMock('../app/globals.css', () => ({}));

// Import the layout component after mocking
const RootLayout = require('../app/layout').default;

describe('RootLayout Component', () => {
  const mockProps = {
    children: React.createElement('div', { 'data-testid': 'test-children' }, 'Test Content')
  };

  beforeEach(() => {
    // Clear any previous DOM modifications
    document.head.innerHTML = '';
    document.body.className = '';
  });

  it('renders the layout with children', () => {
    render(React.createElement(RootLayout, mockProps));
    
    expect(document.querySelector('[data-testid="test-children"]')).toBeInTheDocument();
  });

  it('sets correct HTML attributes', () => {
    render(React.createElement(RootLayout, mockProps));
    
    const htmlElement = document.documentElement;
    expect(htmlElement).toHaveAttribute('lang', 'en');
  });

  it('applies font classes to body', () => {
    render(React.createElement(RootLayout, mockProps));
    
    const bodyElement = document.body;
    // Check for font variable classes and antialiased
    expect(bodyElement.className).toContain('antialiased');
  });

  it('renders children correctly', () => {
    const customChildren = React.createElement('main', { 'data-testid': 'main-content' }, 'Main Content');
    const propsWithCustomChildren = { children: customChildren };
    
    render(React.createElement(RootLayout, propsWithCustomChildren));
    
    expect(document.querySelector('[data-testid="main-content"]')).toBeInTheDocument();
  });

  it('handles multiple children', () => {
    const multipleChildren = [
      React.createElement('header', { key: 'header', 'data-testid': 'header' }, 'Header'),
      React.createElement('main', { key: 'main', 'data-testid': 'main' }, 'Main'),
      React.createElement('footer', { key: 'footer', 'data-testid': 'footer' }, 'Footer')
    ];
    
    render(React.createElement(RootLayout, { children: multipleChildren }));
    
    expect(document.querySelector('[data-testid="header"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="main"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="footer"]')).toBeInTheDocument();
  });

  it('renders HTML structure correctly', () => {
    render(React.createElement(RootLayout, mockProps));
    
    // Check that HTML element exists
    expect(document.documentElement).toBeInTheDocument();
    expect(document.body).toBeInTheDocument();
  });

  it('handles null children gracefully', () => {
    const propsWithNullChildren = { children: null };
    
    render(React.createElement(RootLayout, propsWithNullChildren));
    
    expect(document.body).toBeInTheDocument();
  });

  it('handles empty children gracefully', () => {
    const propsWithEmptyChildren = { children: [] };
    
    render(React.createElement(RootLayout, propsWithEmptyChildren));
    
    expect(document.body).toBeInTheDocument();
  });

  it('preserves component structure', () => {
    const complexChildren = React.createElement(
      'div',
      { 'data-testid': 'complex-structure' },
      React.createElement('h1', {}, 'Title'),
      React.createElement('p', {}, 'Paragraph'),
      React.createElement('button', {}, 'Button')
    );
    
    render(React.createElement(RootLayout, { children: complexChildren }));
    
    expect(document.querySelector('[data-testid="complex-structure"]')).toBeInTheDocument();
    expect(document.querySelector('h1')).toHaveTextContent('Title');
    expect(document.querySelector('p')).toHaveTextContent('Paragraph');
    expect(document.querySelector('button')).toHaveTextContent('Button');
  });

  it('renders without errors', () => {
    expect(() => {
      render(React.createElement(RootLayout, mockProps));
    }).not.toThrow();
  });

  it('maintains consistent structure across renders', () => {
    const { rerender } = render(React.createElement(RootLayout, mockProps));
    
    expect(document.querySelector('[data-testid="test-children"]')).toBeInTheDocument();
    
    const newChildren = React.createElement('div', { 'data-testid': 'new-children' }, 'New Content');
    rerender(React.createElement(RootLayout, { children: newChildren }));
    
    expect(document.querySelector('[data-testid="new-children"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="test-children"]')).not.toBeInTheDocument();
  });

  it('applies correct body classes', () => {
    render(React.createElement(RootLayout, mockProps));
    
    const bodyElement = document.body;
    const bodyClasses = bodyElement.className;
    
    // Should contain font variables and antialiased
    expect(bodyClasses).toMatch(/antialiased/);
  });

  describe('Font Loading', () => {
    it('loads fonts without errors', () => {
      const { Geist, Geist_Mono, Poppins } = require('next/font/google');
      
      expect(Geist).toHaveBeenCalledWith({
        variable: "--font-geist-sans",
        subsets: ["latin"],
      });
      
      expect(Geist_Mono).toHaveBeenCalledWith({
        variable: "--font-geist-mono",
        subsets: ["latin"],
      });
      
      expect(Poppins).toHaveBeenCalledWith({
        subsets: ['latin'],
        weight: ['300', '400', '500', '600', '700'],
        variable: '--font-poppins',
        display: 'swap',
      });
    });
  });

  describe('Metadata', () => {
    it('exports metadata correctly', () => {
      const LayoutModule = require('../app/layout');
      
      expect(LayoutModule.metadata).toBeDefined();
      expect(LayoutModule.metadata.title).toBe('WeEat');
      expect(LayoutModule.metadata.description).toBe('WeEat - Tu comida a un clic');
    });
  });
}); 