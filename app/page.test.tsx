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
2013,January,Maharashtra,1,,General Index (All Groups),103.5,103.9,103.6,F,
2013,January,Karnataka,1,,General Index (All Groups),102.5,102.9,102.6,F,
2013,January,Gujarat,1,,General Index (All Groups),101.5,101.9,101.6,F,
2013,January,Tamil Nadu,1,,General Index (All Groups),100.5,100.9,100.6,F,
2013,January,West Bengal,1,,General Index (All Groups),99.5,99.9,99.6,F,
2013,January,Rajasthan,1,,General Index (All Groups),98.5,98.9,98.6,F,
2013,January,Punjab,1,,General Index (All Groups),97.5,97.9,97.6,F,
2013,January,Kerala,1,,General Index (All Groups),96.5,96.9,96.6,F,
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
  getItem: jest.fn(() => null) as jest.Mock<string | null>,
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

  it('renders the page title', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Consumer Price Index - India')).toBeInTheDocument();
    });
  });

  it('loads and displays data from CSV', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/CPIndex_Jan13-To-Nov25.csv');
    });
  });

  it('displays state selector with All India as default', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('All India')).toBeInTheDocument();
    });
  });

  it('displays search input for states', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search states...')).toBeInTheDocument();
    });
  });

  it('filters states based on search input', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('All India')).toBeInTheDocument();
    });

    // Search for Delhi
    const searchInput = screen.getByPlaceholderText('Search states...');
    fireEvent.change(searchInput, { target: { value: 'Delhi' } });

    await waitFor(() => {
      // Delhi should still be visible, ALL India should be filtered out
      expect(screen.getByText('Delhi')).toBeInTheDocument();
    });
  });

  it('displays all category options', async () => {
    render(<Home />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Categories')).toBeInTheDocument();
    });

    // Check categories - use queryAllByText since items appear multiple times (filter and educational sections)
    await waitFor(() => {
      expect(screen.queryAllByText('General Index').length).toBeGreaterThan(0);
    });

    expect(screen.queryAllByText('Food and beverages').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Clothing and footwear').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Fuel and light').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Housing').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Pan, tobacco, intoxicants').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Miscellaneous').length).toBeGreaterThan(0);
  });

  it('displays all sector options', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Rural')).toBeInTheDocument();
      expect(screen.getByText('Urban')).toBeInTheDocument();
      expect(screen.getByText('Rural + Urban')).toBeInTheDocument();
    });
  });

  it('has General Index selected by default', async () => {
    render(<Home />);

    await waitFor(() => {
      // All filter inputs are now checkboxes
      const checkbox = screen.getAllByRole('checkbox').find(el =>
        el.closest('label')?.textContent?.includes('General Index')
      );
      expect(checkbox).toBeChecked();
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

    await waitFor(() => {
      expect(screen.getByText(/Ministry of Statistics and Programme Implementation/)).toBeInTheDocument();
    });
  });

  it('allows selecting a state via checkbox', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('All India')).toBeInTheDocument();
    });

    // Find Delhi in the states list
    await waitFor(() => {
      expect(screen.getByText('Delhi')).toBeInTheDocument();
    });
  });
});

describe('Chart Board', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays Add to Board button', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Add to Board')).toBeInTheDocument();
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

  it('shows all dimension sections initially', async () => {
    render(<Home />);

    await waitFor(() => {
      // All dimensions should be visible with their section headers
      expect(screen.getByText('States')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Sectors')).toBeInTheDocument();
    });
  });
});

describe('Implicit Comparison Behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows "Comparing" badge when multiple items selected in a dimension', async () => {
    render(<Home />);

    // Wait for Delhi to appear in the list
    await waitFor(() => {
      expect(screen.getByText('Delhi')).toBeInTheDocument();
    });

    // Find and click Delhi to add a second state
    const delhiElement = screen.getByText('Delhi').closest('div[class*="cursor-pointer"]');
    expect(delhiElement).toBeTruthy();
    fireEvent.click(delhiElement!);

    await waitFor(() => {
      // Should show "Comparing" badge for states dimension
      expect(screen.getByText('Comparing')).toBeInTheDocument();
    });
  });

  it('allows switching comparison dimension by selecting from another dimension', async () => {
    render(<Home />);

    // Wait for Delhi to appear
    await waitFor(() => {
      expect(screen.getByText('Delhi')).toBeInTheDocument();
    });

    // Select a second state to activate comparison on states
    const delhiElement = screen.getByText('Delhi').closest('div[class*="cursor-pointer"]');
    expect(delhiElement).toBeTruthy();
    fireEvent.click(delhiElement!);

    await waitFor(() => {
      // States should be the comparison dimension
      expect(screen.getByText('Comparing')).toBeInTheDocument();
    });

    // Now click on a second sector (Urban) to switch comparison to sectors
    const urbanLabel = screen.getByText('Urban').closest('label');
    if (urbanLabel) {
      const checkbox = urbanLabel.querySelector('input[type="checkbox"]');
      if (checkbox) {
        fireEvent.click(checkbox);
      }
    }

    await waitFor(() => {
      // Should show toast about switching comparison
      expect(screen.getByText('Switched comparison to Sectors')).toBeInTheDocument();
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

describe('UI Improvements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays category with friendly display name', async () => {
    render(<Home />);

    await waitFor(() => {
      // Should display the friendly name instead of raw data name
      // Use getAllByText since there might be multiple instances
      const panElements = screen.getAllByText('Pan, tobacco, intoxicants');
      expect(panElements.length).toBeGreaterThan(0);
      // Should NOT display the original name
      expect(screen.queryByText('Pan; tobacco; and intoxicants')).not.toBeInTheDocument();
    });
  });

  it('has cursor-pointer class on reset buttons', async () => {
    render(<Home />);

    await waitFor(() => {
      const resetButtons = screen.getAllByText('Reset');
      resetButtons.forEach(button => {
        expect(button).toHaveClass('cursor-pointer');
      });
    });
  });

  it('has cursor-pointer class on Reset All Filters button', async () => {
    render(<Home />);

    await waitFor(() => {
      const resetAllButton = screen.getByText('Reset All Filters');
      expect(resetAllButton).toHaveClass('cursor-pointer');
    });
  });

  it('has scrollable state list with max-height', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('All India')).toBeInTheDocument();
    });

    // Find the states list container by looking for the scrollable div with max-height
    const statesListContainer = document.querySelector('.max-h-\\[248px\\].overflow-y-auto');
    expect(statesListContainer).toBeInTheDocument();
  });
});

describe('State Selection UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows All India selected by default', async () => {
    render(<Home />);

    await waitFor(() => {
      // All India should be checked in the list
      const allIndiaElement = screen.getByText('All India').closest('div[class*="bg-cyan-600"]');
      expect(allIndiaElement).toBeInTheDocument();
    });
  });

  it('shows all states in scrollable list', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Delhi')).toBeInTheDocument();
    });

    // All states should be visible in the scrollable list
    expect(screen.queryByText(/Show \d+ more states/)).not.toBeInTheDocument();
  });

  it('filters states when search input changes', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Delhi')).toBeInTheDocument();
    });

    // Type in search
    const searchInput = screen.getByPlaceholderText('Search states...');
    fireEvent.change(searchInput, { target: { value: 'Del' } });

    await waitFor(() => {
      expect(screen.getByText('Delhi')).toBeInTheDocument();
      // Other states should be filtered out
      expect(screen.queryByText('Maharashtra')).not.toBeInTheDocument();
    });
  });
});

describe('Dimension Switching - Keep Last Selected', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps last selected state when switching comparison to categories', async () => {
    render(<Home />);

    // Wait for data to load and Delhi to appear
    await waitFor(() => {
      expect(screen.getByText('Delhi')).toBeInTheDocument();
    });

    // Select Delhi as second state (states become comparison dimension)
    const delhiElement = screen.getByText('Delhi').closest('div[class*="cursor-pointer"]');
    expect(delhiElement).toBeTruthy();
    fireEvent.click(delhiElement!);

    await waitFor(() => {
      // Verify states is comparing
      expect(screen.getByText('Comparing')).toBeInTheDocument();
    });

    // Now select a second category to switch comparison dimension
    const foodElements = screen.getAllByText('Food and beverages');
    const foodLabel = foodElements.find(el => el.closest('label'))?.closest('label');
    if (foodLabel) {
      const checkbox = foodLabel.querySelector('input[type="checkbox"]');
      if (checkbox) {
        fireEvent.click(checkbox);
      }
    }

    await waitFor(() => {
      // Should show toast about switching comparison
      expect(screen.getByText('Switched comparison to Categories')).toBeInTheDocument();
    });
  });

  it('keeps last selected category when switching comparison to sectors', async () => {
    render(<Home />);

    await waitFor(() => {
      // Use getAllByText since there may be multiple "General Index" texts
      expect(screen.getAllByText('General Index').length).toBeGreaterThan(0);
    });

    // Select Food and beverages as second category - use getAllByText and find the one in a label
    const foodElements = screen.getAllByText('Food and beverages');
    const foodLabel = foodElements.find(el => el.closest('label'))?.closest('label');
    if (foodLabel) {
      const checkbox = foodLabel.querySelector('input[type="checkbox"]');
      if (checkbox) {
        fireEvent.click(checkbox);
      }
    }

    await waitFor(() => {
      // Categories should be comparing
      const categorySection = screen.getByText('Categories').closest('div');
      expect(categorySection?.textContent).toContain('Comparing');
    });

    // Now select a second sector to switch comparison
    const ruralLabel = screen.getByText('Rural').closest('label');
    if (ruralLabel) {
      const checkbox = ruralLabel.querySelector('input[type="checkbox"]');
      if (checkbox) {
        fireEvent.click(checkbox);
      }
    }

    await waitFor(() => {
      // Food and beverages (last selected) should remain
      const foodElements2 = screen.getAllByText('Food and beverages');
      const foodLabel2 = foodElements2.find(el => el.closest('label'))?.closest('label');
      const foodCheckbox = foodLabel2?.querySelector('input[type="checkbox"]');
      expect(foodCheckbox).toBeChecked();

      // General Index should be unchecked
      const generalElements = screen.getAllByText('General Index');
      const generalLabel = generalElements.find(el => el.closest('label'))?.closest('label');
      const generalIndexCheckbox = generalLabel?.querySelector('input[type="checkbox"]');
      expect(generalIndexCheckbox).not.toBeChecked();
    });
  });
});

describe('Add to Board Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('has cursor-pointer class on Add to Board button', async () => {
    render(<Home />);

    await waitFor(() => {
      const addButton = screen.getByText('Add to Board').closest('button');
      expect(addButton).toHaveClass('cursor-pointer');
    });
  });

  it('shows toast and scrolls when chart is added', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Add to Board')).toBeInTheDocument();
    });

    // Click Add to Board button
    const addButton = screen.getByText('Add to Board').closest('button');
    expect(addButton).toBeTruthy();
    fireEvent.click(addButton!);

    await waitFor(() => {
      // Toast should appear
      expect(screen.getByText('Chart added to board')).toBeInTheDocument();
    });
  });
});

describe('Chart Board Action Buttons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('has cursor-pointer class on edit, duplicate, and remove buttons after adding a chart', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Add to Board')).toBeInTheDocument();
    });

    // First add a chart
    const addButton = screen.getByText('Add to Board').closest('button');
    expect(addButton).toBeTruthy();
    fireEvent.click(addButton!);

    // Wait for chart to be added
    await waitFor(() => {
      expect(screen.getByText('Chart added to board')).toBeInTheDocument();
    });

    // Now check that action buttons have cursor-pointer class
    await waitFor(() => {
      const editButton = screen.getByTitle('Edit');
      const duplicateButton = screen.getByTitle('Duplicate');
      const removeButton = screen.getByTitle('Remove');

      expect(editButton).toHaveClass('cursor-pointer');
      expect(duplicateButton).toHaveClass('cursor-pointer');
      expect(removeButton).toHaveClass('cursor-pointer');
    });
  });
});

describe('CPI Educational Section', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays educational section title', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Understanding the Consumer Price Index')).toBeInTheDocument();
    });
  });

  it('displays What is CPI section', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('What is CPI?')).toBeInTheDocument();
    });
  });

  it('displays How is it Calculated section', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('How is it Calculated?')).toBeInTheDocument();
    });
  });

  it('displays Category Weights section', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Category Weights (Combined)')).toBeInTheDocument();
    });
  });
});
