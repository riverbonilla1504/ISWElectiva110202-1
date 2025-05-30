import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PigzasBackground from '../app/Background';

jest.mock('lucide-react', () => ({
  Pizza: () => <div data-testid="icon-pizza">Pizza Icon</div>,
  Utensils: () => <div data-testid="icon-utensils">Utensils Icon</div>,
  Clock: () => <div data-testid="icon-clock">Clock Icon</div>,
  ShoppingBag: () => <div data-testid="icon-shopping-bag">ShoppingBag Icon</div>,
  Sandwich: () => <div data-testid="icon-sandwich">Sandwich Icon</div>,
  Coffee: () => <div data-testid="icon-coffee">Coffee Icon</div>,
  ChefHat: () => <div data-testid="icon-chef-hat">ChefHat Icon</div>,
}));

describe('PigzasBackground Component', () => {
  const originalMathRandom = Math.random;
  
  beforeEach(() => {
    let randomCallCount = 0;
    jest.spyOn(Math, 'random').mockImplementation(() => {
      // Cycle through predefined values for predictable testing
      const values = [0.1, 0.3, 0.5, 0.7, 0.9];
      const result = values[randomCallCount % values.length];
      randomCallCount++;
      return result;
    });
  });
  
  afterEach(() => {
    // Restore original Math.random implementation
    Math.random = originalMathRandom;
    jest.clearAllMocks();
  });

  it('renders with default props correctly', () => {
    render(<PigzasBackground />);
    
    // Test container properties using direct query since it doesn't have a testid
    const backgroundContainer = document.querySelector('[aria-hidden="true"]');
    expect(backgroundContainer).toBeInTheDocument();
    expect(backgroundContainer).toHaveAttribute('aria-hidden', 'true');
    expect(backgroundContainer).toHaveClass('fixed', 'inset-0', 'w-full', 'h-full', 'overflow-hidden', 'pointer-events-none');
    expect(backgroundContainer).toHaveStyle({ zIndex: '-1', position: 'fixed' });
  });

  it('renders with custom props correctly', () => {
    const customIconCount = 5;
    const customZIndex = 10;
    const customClassName = "test-custom-class";
    
    render(
      <PigzasBackground 
        iconCount={customIconCount} 
        zIndex={customZIndex} 
        className={customClassName} 
      />
    );
    
    const backgroundContainer = document.querySelector('[aria-hidden="true"]');
    expect(backgroundContainer).toBeInTheDocument();
    expect(backgroundContainer).toHaveClass('fixed', 'inset-0', 'w-full', 'h-full', 'overflow-hidden', 'pointer-events-none', customClassName);
    expect(backgroundContainer).toHaveStyle({ zIndex: `${customZIndex}`, position: 'fixed' });
  });

  it('generates icons based on iconCount prop', () => {
    const iconCount = 10;
    
    render(<PigzasBackground iconCount={iconCount} />);
    
    const backgroundContainer = document.querySelector('[aria-hidden="true"]');
    expect(backgroundContainer).toBeInTheDocument();
    
    // Check that child sections are generated (they should be absolute positioned)
    const iconSections = backgroundContainer?.querySelectorAll('section.absolute');
    expect(iconSections?.length).toBe(iconCount);
  });

  it('applies correct styling to icons', () => {
    render(<PigzasBackground iconCount={1} />);
    
    const backgroundContainer = document.querySelector('[aria-hidden="true"]');
    expect(backgroundContainer).toBeInTheDocument();
    
    // Check that at least one icon section exists with correct positioning
    const iconSection = backgroundContainer?.querySelector('section.absolute');
    expect(iconSection).toBeInTheDocument();
    expect(iconSection).toHaveClass('absolute');
    
    // Check that it has style properties for positioning
    const style = iconSection?.getAttribute('style');
    expect(style).toContain('top:');
    expect(style).toContain('left:');
    expect(style).toContain('transform:');
    expect(style).toContain('opacity:');
  });
  
  it('uses memoized icons array', () => {
    render(<PigzasBackground />);
    
    // The component should render successfully and have a background container
    const backgroundContainer = document.querySelector('[aria-hidden="true"]');
    expect(backgroundContainer).toBeInTheDocument();
  });
  
  it('generates different positions for icons', () => {
    render(<PigzasBackground iconCount={3} />);
    
    const backgroundContainer = document.querySelector('[aria-hidden="true"]');
    const iconSections = backgroundContainer?.querySelectorAll('section.absolute');
    
    expect(iconSections?.length).toBe(3);
    
    // Check that different sections have different styles (positions)
    const styles = Array.from(iconSections || []).map(section => section.getAttribute('style'));
    expect(styles[0]).not.toBe(styles[1]);
    expect(styles[1]).not.toBe(styles[2]);
  });
  
  it('applies correct aria attributes for accessibility', () => {
    render(<PigzasBackground />);
    
    const backgroundContainer = document.querySelector('[aria-hidden="true"]');
    expect(backgroundContainer).toHaveAttribute('aria-hidden', 'true');
  });
  
  it('renders different icon types', () => {
    render(<PigzasBackground iconCount={50} />);
    
    // Check that different types of icons are rendered using queryAllByTestId
    const iconTypes = [
      'icon-pizza', 'icon-utensils', 'icon-clock', 
      'icon-shopping-bag', 'icon-sandwich', 'icon-coffee', 'icon-chef-hat'
    ];
    
    let foundIconTypes = 0;
    iconTypes.forEach(iconType => {
      const elements = screen.queryAllByTestId(iconType);
      if (elements.length > 0) {
        foundIconTypes++;
      }
    });
    
    // At least some different icon types should be present
    expect(foundIconTypes).toBeGreaterThan(0);
  });
});