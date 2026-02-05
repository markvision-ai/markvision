import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UnitEconomics } from '../UnitEconomics';

describe('UnitEconomics Component', () => {
  it('renders correctly with initial props', () => {
    render(<UnitEconomics avgCheck={500000} cac={50000} />);
    
    expect(screen.getByText('Юнит-экономика')).toBeInTheDocument();
    
    // Check for the presence of key labels and values separately to avoid formatting issues
    // The component renders: <span ...>CAC = {val}</span>
    // We use a function matcher to be safe against non-breaking spaces and different locale formatting
    expect(screen.getByText((content) => content.includes('CAC') && content.includes('50'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Ср. чека') && content.includes('500'))).toBeInTheDocument();
  });

  it('calculates LTV correctly', () => {
    render(<UnitEconomics avgCheck={1000} cac={100} />);
    
    // Initial values: Margin 30%, Freq 1, Lifetime 6
    // Profit per sale = 1000 * 0.3 = 300
    // LTV = 300 * 1 * 6 = 1800
    
    // Use regex to find the LTV value in the document
    expect(screen.getByText(/1\s?800/)).toBeInTheDocument(); 
  });

  it('updates calculations when inputs change', () => {
    render(<UnitEconomics avgCheck={1000} cac={100} />);
    
    const marginInput = screen.getByLabelText(/Маржинальность/i);
    fireEvent.change(marginInput, { target: { value: '50' } });
    
    // New Profit = 1000 * 0.5 = 500
    // LTV = 500 * 1 * 6 = 3000
    
    expect(screen.getByText(/3\s?000/)).toBeInTheDocument();
  });

  it('calculates Payback Period correctly', () => {
    render(<UnitEconomics avgCheck={1000} cac={300} />);
    
    // Margin 30% -> Profit 300
    // Payback = 300 / 300 = 1.0
    
    expect(screen.getByText('1.0')).toBeInTheDocument();
  });

  it('calculates ROI correctly', () => {
    render(<UnitEconomics avgCheck={1000} cac={200} />);
    
    // Margin 30% -> Profit 300
    // LTV = 300 * 1 * 6 = 1800
    // ROI = (1800 - 200) / 200 * 100 = 1600 / 200 * 100 = 800%
    
    expect(screen.getByText('800%')).toBeInTheDocument();
  });

  it('handles zero values gracefully', () => {
    render(<UnitEconomics avgCheck={0} cac={0} />);
    
    expect(screen.getByText('0%')).toBeInTheDocument(); // ROI
  });
});
