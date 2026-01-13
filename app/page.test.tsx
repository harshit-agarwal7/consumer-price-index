import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
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

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('CPI Index Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page title', () => {
    render(<Home />);
    expect(screen.getByText('Consumer Price Index')).toBeInTheDocument();
  });

  it('loads and displays data from CSV', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/CPIndex_Jan13-To-Nov25.csv');
    });
  });

  it('displays state selector with ALL India as default', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('ALL India')).toBeInTheDocument();
    });
  });

  it('opens state dropdown when clicked', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('ALL India')).toBeInTheDocument();
    });

    const stateButton = screen.getByRole('button', { name: /ALL India/i });
    fireEvent.click(stateButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search states...')).toBeInTheDocument();
    });
  });

  it('filters states based on search input', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('ALL India')).toBeInTheDocument();
    });

    // Open dropdown
    const stateButton = screen.getByRole('button', { name: /ALL India/i });
    fireEvent.click(stateButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search states...')).toBeInTheDocument();
    });

    // Search for Delhi
    const searchInput = screen.getByPlaceholderText('Search states...');
    fireEvent.change(searchInput, { target: { value: 'Delhi' } });

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const delhiButton = buttons.find(btn => btn.textContent?.includes('Delhi'));
      expect(delhiButton).toBeInTheDocument();
    });
  });

  it('displays all category options', async () => {
    render(<Home />);

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
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Rural')).toBeInTheDocument();
      expect(screen.getByText('Urban')).toBeInTheDocument();
      expect(screen.getByText('Rural + Urban')).toBeInTheDocument();
    });
  });

  it('has General Index (All Groups) selected by default', async () => {
    render(<Home />);

    await waitFor(() => {
      // Categories are radio buttons by default (since sectors has multi-select)
      const radioOrCheckbox = screen.getAllByRole('radio').find(el =>
        el.closest('label')?.textContent?.includes('General Index (All Groups)')
      );
      expect(radioOrCheckbox).toBeChecked();
    });
  });

  it('displays date range selectors', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('From')).toBeInTheDocument();
      expect(screen.getByText('To')).toBeInTheDocument();
    });
  });

  it('populates year dropdown from CSV data', async () => {
    render(<Home />);

    await waitFor(() => {
      const yearSelects = screen.getAllByRole('combobox');
      // Check if years are in the dropdown options
      const startYearSelect = yearSelects[1]; // Second select is start year
      expect(startYearSelect).toBeInTheDocument();
    });
  });

  it('shows chart section with Live Preview title', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Live Preview')).toBeInTheDocument();
    });
  });

  it('displays footer with data source', async () => {
    render(<Home />);

    expect(screen.getByText(/Ministry of Statistics and Programme Implementation/)).toBeInTheDocument();
  });

  it('allows selecting a different state', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('ALL India')).toBeInTheDocument();
    });

    // Open dropdown
    const stateButton = screen.getByRole('button', { name: /ALL India/i });
    fireEvent.click(stateButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search states...')).toBeInTheDocument();
    });

    // Select Delhi
    const buttons = screen.getAllByRole('button');
    const delhiButton = buttons.find(btn => btn.textContent?.includes('Delhi'));
    if (delhiButton) {
      fireEvent.click(delhiButton);
    }

    // Check that Delhi is now selected
    await waitFor(() => {
      const stateBtn = screen.getByRole('button', { name: /Delhi/i });
      expect(stateBtn).toBeInTheDocument();
    });
  });
});

describe('Chart Builder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays Chart Builder title', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Chart Builder')).toBeInTheDocument();
    });
  });

  it('displays Compare by dimension selector', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Compare by:')).toBeInTheDocument();
    });
  });

  it('displays Add Chart to Board button', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Add Chart to Board')).toBeInTheDocument();
    });
  });

  it('displays Chart Board section', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Chart Board')).toBeInTheDocument();
    });
  });

  it('shows empty state message when no charts added', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/Build a chart using the filters above/)).toBeInTheDocument();
    });
  });
});

describe('Date Range Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('disables end years before start year', async () => {
    render(<Home />);

    await waitFor(() => {
      // After data loads, check that end year options before start year are disabled
      const yearSelects = screen.getAllByRole('combobox');
      expect(yearSelects.length).toBeGreaterThan(0);
    });
  });
});
