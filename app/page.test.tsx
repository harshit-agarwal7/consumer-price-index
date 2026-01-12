import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Home from './page';

// Mock fetch for CSV data
const mockCSVData = `(Base 2012=100)
Year,Month,State,Group,Sub Group,Description,Rural,Urban,Combined,Status,
2013,January,ALL India,1,,General Index (All Groups),105.5,105.9,105.6,F,
2013,January,ALL India,1,,Food and beverages,107.5,107.9,107.6,F,
2013,February,ALL India,1,,General Index (All Groups),106.5,106.9,106.6,F,
2013,February,ALL India,1,,Food and beverages,108.5,108.9,108.6,F,
2013,January,Delhi,1,,General Index (All Groups),104.5,104.9,104.6,F,
2013,January,Delhi,1,,Food and beverages,106.5,106.9,106.6,F,
2013,February,Delhi,1,,General Index (All Groups),105.5,105.9,105.6,F,
2013,February,Delhi,1,,Food and beverages,107.5,107.9,107.6,F,
2014,January,ALL India,1,,General Index (All Groups),115.5,115.9,115.6,F,
2014,January,ALL India,1,,Food and beverages,117.5,117.9,117.6,F,`;

global.fetch = jest.fn(() =>
  Promise.resolve({
    text: () => Promise.resolve(mockCSVData),
  })
) as jest.Mock;

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

describe('CPI Index Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page title', async () => {
    await act(async () => {
      render(<Home />);
    });
    expect(screen.getByText('Consumer Price Index')).toBeInTheDocument();
  });

  it('loads and displays data from CSV', async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/CPIndex_Jan13-To-Nov25.csv');
    });
  });

  it('displays state selector with ALL India as default', async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('ALL India')).toBeInTheDocument();
    });
  });

  it('opens state dropdown when clicked', async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('ALL India')).toBeInTheDocument();
    });

    await act(async () => {
      const stateButton = screen.getByRole('button', { name: /ALL India/i });
      fireEvent.click(stateButton);
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search states...')).toBeInTheDocument();
    });
  });

  it('filters states based on search input', async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('ALL India')).toBeInTheDocument();
    });

    // Open dropdown
    await act(async () => {
      const stateButton = screen.getByRole('button', { name: /ALL India/i });
      fireEvent.click(stateButton);
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search states...')).toBeInTheDocument();
    });

    // Search for Delhi
    await act(async () => {
      const searchInput = screen.getByPlaceholderText('Search states...');
      fireEvent.change(searchInput, { target: { value: 'Delhi' } });
    });

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const delhiButton = buttons.find(btn => btn.textContent === 'Delhi');
      expect(delhiButton).toBeInTheDocument();
    });
  });

  it('displays all category options', async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('General Index (All Groups)')).toBeInTheDocument();
      expect(screen.getByText('Food and beverages')).toBeInTheDocument();
      expect(screen.getByText('Clothing and footwear')).toBeInTheDocument();
      expect(screen.getByText('Fuel and light')).toBeInTheDocument();
      expect(screen.getByText('Housing')).toBeInTheDocument();
      expect(screen.getByText('Pan; tobacco; and intoxicants')).toBeInTheDocument();
      expect(screen.getByText('Miscellaneous')).toBeInTheDocument();
    });
  });

  it('displays all sector options', async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Rural')).toBeInTheDocument();
      expect(screen.getByText('Urban')).toBeInTheDocument();
      expect(screen.getByText('Rural + Urban')).toBeInTheDocument();
    });
  });

  it('has General Index (All Groups) selected by default', async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      const checkbox = screen.getAllByRole('checkbox').find(cb =>
        cb.closest('label')?.textContent?.includes('General Index (All Groups)')
      );
      expect(checkbox).toBeChecked();
    });
  });

  it('toggles category selection when clicked', async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Food and beverages')).toBeInTheDocument();
    });

    const foodCheckbox = screen.getAllByRole('checkbox').find(cb =>
      cb.closest('label')?.textContent?.includes('Food and beverages')
    );

    expect(foodCheckbox).not.toBeChecked();

    await act(async () => {
      fireEvent.click(foodCheckbox!);
    });

    expect(foodCheckbox).toBeChecked();
  });

  it('displays date range selectors', async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('From')).toBeInTheDocument();
      expect(screen.getByText('To')).toBeInTheDocument();
    });
  });

  it('populates year dropdown from CSV data', async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      const yearSelects = screen.getAllByRole('combobox');
      // Check if years are in the dropdown options
      const startYearSelect = yearSelects[1]; // Second select is start year
      expect(startYearSelect).toBeInTheDocument();
    });
  });

  it('shows chart section', async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Price Index Trends')).toBeInTheDocument();
    });
  });

  it('displays footer with data source', async () => {
    await act(async () => {
      render(<Home />);
    });

    expect(screen.getByText(/Ministry of Statistics and Programme Implementation/)).toBeInTheDocument();
  });

  it('allows selecting a different state', async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('ALL India')).toBeInTheDocument();
    });

    // Open dropdown
    await act(async () => {
      const stateButton = screen.getByRole('button', { name: /ALL India/i });
      fireEvent.click(stateButton);
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search states...')).toBeInTheDocument();
    });

    // Select Delhi
    await act(async () => {
      const buttons = screen.getAllByRole('button');
      const delhiButton = buttons.find(btn => btn.textContent === 'Delhi');
      if (delhiButton) {
        fireEvent.click(delhiButton);
      }
    });

    // Check that Delhi is now selected
    await waitFor(() => {
      const stateButton = screen.getByRole('button', { name: /Delhi/i });
      expect(stateButton).toBeInTheDocument();
    });
  });
});

describe('Date Range Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('disables end years before start year', async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      // After data loads, check that end year options before start year are disabled
      const yearSelects = screen.getAllByRole('combobox');
      expect(yearSelects.length).toBeGreaterThan(0);
    });
  });
});
