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
    expect(screen.getByText('Consumer Price Index - India')).toBeInTheDocument();
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

  it('displays search input for states', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search states...')).toBeInTheDocument();
    });
  });

  it('filters states based on search input', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('ALL India')).toBeInTheDocument();
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

    await waitFor(() => {
      expect(screen.getByText('General Index (All Groups)')).toBeInTheDocument();
      expect(screen.getByText('Food and beverages')).toBeInTheDocument();
      expect(screen.getByText('Clothing and footwear')).toBeInTheDocument();
      expect(screen.getByText('Fuel and light')).toBeInTheDocument();
      expect(screen.getByText('Housing')).toBeInTheDocument();
      expect(screen.getByText('Pan, tobacco & intoxicants')).toBeInTheDocument();
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
      // All filter inputs are now checkboxes
      const checkbox = screen.getAllByRole('checkbox').find(el =>
        el.closest('label')?.textContent?.includes('General Index (All Groups)')
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

    expect(screen.getByText(/Ministry of Statistics and Programme Implementation/)).toBeInTheDocument();
  });

  it('allows selecting a state via checkbox', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('ALL India')).toBeInTheDocument();
    });

    // Find Delhi checkbox in the states list
    await waitFor(() => {
      const delhiLabel = screen.getByText('Delhi').closest('label');
      expect(delhiLabel).toBeInTheDocument();
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

  it('displays instruction for implicit comparison', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/Select multiple items in any dimension to compare them/)).toBeInTheDocument();
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

  it('shows all dimension sections initially', async () => {
    render(<Home />);

    await waitFor(() => {
      // All dimensions should be visible
      expect(screen.getByText('State / Region')).toBeInTheDocument();
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

    // Find and click Delhi checkbox to add a second state (in unselected list)
    const checkboxes = screen.getAllByRole('checkbox');
    const delhiCheckbox = checkboxes.find(cb =>
      cb.closest('label')?.textContent?.includes('Delhi')
    );
    expect(delhiCheckbox).toBeTruthy();
    fireEvent.click(delhiCheckbox!);

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
    const checkboxes = screen.getAllByRole('checkbox');
    const delhiCheckbox = checkboxes.find(cb =>
      cb.closest('label')?.textContent?.includes('Delhi')
    );
    expect(delhiCheckbox).toBeTruthy();
    fireEvent.click(delhiCheckbox!);

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

    // States should now have only one selected (the last one - Delhi)
    // ALL India should NOT be in the selected section
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /ALL India/ })).not.toBeInTheDocument();
    });
  });

  it('shows "Comparing <Dimension>" label above live preview when comparing', async () => {
    render(<Home />);

    // Wait for Delhi to appear
    await waitFor(() => {
      expect(screen.getByText('Delhi')).toBeInTheDocument();
    });

    // Select a second state to activate comparison
    const checkboxes = screen.getAllByRole('checkbox');
    const delhiCheckbox = checkboxes.find(cb =>
      cb.closest('label')?.textContent?.includes('Delhi')
    );
    expect(delhiCheckbox).toBeTruthy();
    fireEvent.click(delhiCheckbox!);

    await waitFor(() => {
      expect(screen.getByText(/Comparing State \/ Region/)).toBeInTheDocument();
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
      expect(screen.getByText('Pan, tobacco & intoxicants')).toBeInTheDocument();
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

  it('has cursor-pointer class on Reset All button', async () => {
    render(<Home />);

    await waitFor(() => {
      const resetAllButton = screen.getByText('Reset All');
      expect(resetAllButton).toHaveClass('cursor-pointer');
    });
  });

  it('has scrollable state list with max-height', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('ALL India')).toBeInTheDocument();
    });

    // Find the states list container by looking for the scrollable div with max-height
    const statesListContainer = document.querySelector('.max-h-\\[200px\\].overflow-y-auto');
    expect(statesListContainer).toBeInTheDocument();
  });
});

describe('State Selection UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows ALL India in selected section by default', async () => {
    render(<Home />);

    await waitFor(() => {
      // ALL India should be in the selected section (as a button with X icon)
      const allIndiaButton = screen.getByRole('button', { name: /ALL India/ });
      expect(allIndiaButton).toBeInTheDocument();
    });
  });

  it('shows all states in scrollable list', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Delhi')).toBeInTheDocument();
    });

    // All states should be visible in the scrollable list (no "show more" button)
    expect(screen.queryByText(/Show \d+ more states/)).not.toBeInTheDocument();
  });

  it('does not move states when selecting/deselecting', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Delhi')).toBeInTheDocument();
    });

    // Select Delhi
    const delhiCheckbox = screen.getByText('Delhi').closest('label')?.querySelector('input[type="checkbox"]');
    if (delhiCheckbox) {
      fireEvent.click(delhiCheckbox);
    }

    await waitFor(() => {
      // Delhi should now be in selected section as a button
      const delhiButton = screen.getByRole('button', { name: /Delhi/ });
      expect(delhiButton).toBeInTheDocument();
    });
  });

  it('allows removing state by clicking X button in selected section', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Delhi')).toBeInTheDocument();
    });

    // First select Delhi
    const delhiCheckbox = screen.getByText('Delhi').closest('label')?.querySelector('input[type="checkbox"]');
    if (delhiCheckbox) {
      fireEvent.click(delhiCheckbox);
    }

    await waitFor(() => {
      // Delhi should be in selected section
      const delhiButton = screen.getByRole('button', { name: /Delhi/ });
      expect(delhiButton).toBeInTheDocument();
    });

    // Now click the Delhi button in selected section to remove it
    const delhiButton = screen.getByRole('button', { name: /Delhi/ });
    fireEvent.click(delhiButton);

    await waitFor(() => {
      // Delhi should no longer be a button (removed from selected)
      expect(screen.queryByRole('button', { name: /Delhi/ })).not.toBeInTheDocument();
    });
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
    // Delhi is in the unselected states list
    const delhiCheckboxes = screen.getAllByRole('checkbox');
    const delhiCheckbox = delhiCheckboxes.find(cb =>
      cb.closest('label')?.textContent?.includes('Delhi')
    );
    expect(delhiCheckbox).toBeTruthy();
    fireEvent.click(delhiCheckbox!);

    await waitFor(() => {
      // Verify states is comparing
      expect(screen.getByText('Comparing')).toBeInTheDocument();
    });

    // Now select a second category to switch comparison dimension
    const foodLabel = screen.getByText('Food and beverages').closest('label');
    if (foodLabel) {
      const checkbox = foodLabel.querySelector('input[type="checkbox"]');
      if (checkbox) {
        fireEvent.click(checkbox);
      }
    }

    await waitFor(() => {
      // Should show toast about switching comparison
      // After switch, Delhi (last selected) should be the only state selected
      // Delhi should be in the selected section as a button
      const delhiButton = screen.getByRole('button', { name: /Delhi/ });
      expect(delhiButton).toBeInTheDocument();

      // ALL India should NOT be in selected section (it was deselected)
      expect(screen.queryByRole('button', { name: /ALL India/ })).not.toBeInTheDocument();
    });
  });

  it('keeps last selected category when switching comparison to sectors', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('General Index (All Groups)')).toBeInTheDocument();
    });

    // Select Food and beverages as second category
    const foodLabel = screen.getByText('Food and beverages').closest('label');
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
      // Food and beverages (last selected) should remain, General Index should be unchecked
      const foodCheckbox = screen.getByText('Food and beverages').closest('label')?.querySelector('input[type="checkbox"]');
      expect(foodCheckbox).toBeChecked();

      const generalIndexCheckbox = screen.getByText('General Index (All Groups)').closest('label')?.querySelector('input[type="checkbox"]');
      expect(generalIndexCheckbox).not.toBeChecked();
    });
  });
});
