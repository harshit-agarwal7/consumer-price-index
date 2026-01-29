import { render, screen, fireEvent } from '@testing-library/react';
import { MobileFilterAccordion } from './MobileFilterAccordion';

describe('MobileFilterAccordion', () => {
  const mockSections = [
    {
      id: 'states',
      title: 'States',
      dimension: 'states' as const,
      content: <div data-testid="states-content">States Filter Content</div>,
    },
    {
      id: 'categories',
      title: 'Categories',
      dimension: 'categories' as const,
      content: <div data-testid="categories-content">Categories Filter Content</div>,
    },
    {
      id: 'sectors',
      title: 'Sectors',
      dimension: 'sectors' as const,
      content: <div data-testid="sectors-content">Sectors Filter Content</div>,
    },
  ];

  const defaultProps = {
    sections: mockSections,
    expandedId: null,
    onToggle: jest.fn(),
    multiSelectDimension: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render helper message for mobile users', () => {
      render(<MobileFilterAccordion {...defaultProps} />);

      expect(
        screen.getByText(/Tap on a dimension below to see options and view the Consumer Price Index along that dimension/i)
      ).toBeInTheDocument();
    });

    it('should render all section titles', () => {
      render(<MobileFilterAccordion {...defaultProps} />);

      expect(screen.getByText('States')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Sectors')).toBeInTheDocument();
    });

    it('should render section content', () => {
      render(<MobileFilterAccordion {...defaultProps} expandedId="states" />);

      expect(screen.getByTestId('states-content')).toBeInTheDocument();
      expect(screen.getByTestId('categories-content')).toBeInTheDocument();
      expect(screen.getByTestId('sectors-content')).toBeInTheDocument();
    });
  });

  describe('accordion behavior', () => {
    it('should call onToggle when a section header is clicked', () => {
      const onToggle = jest.fn();
      render(<MobileFilterAccordion {...defaultProps} onToggle={onToggle} />);

      fireEvent.click(screen.getByText('States'));

      expect(onToggle).toHaveBeenCalledWith('states');
    });

    it('should call onToggle with correct id for each section', () => {
      const onToggle = jest.fn();
      render(<MobileFilterAccordion {...defaultProps} onToggle={onToggle} />);

      fireEvent.click(screen.getByText('Categories'));
      expect(onToggle).toHaveBeenCalledWith('categories');

      fireEvent.click(screen.getByText('Sectors'));
      expect(onToggle).toHaveBeenCalledWith('sectors');
    });

    it('should set aria-expanded to true for expanded section', () => {
      render(<MobileFilterAccordion {...defaultProps} expandedId="states" />);

      const statesButton = screen.getByText('States').closest('button');
      const categoriesButton = screen.getByText('Categories').closest('button');

      expect(statesButton).toHaveAttribute('aria-expanded', 'true');
      expect(categoriesButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('comparing badge', () => {
    it('should show Comparing badge for the multi-select dimension', () => {
      render(
        <MobileFilterAccordion
          {...defaultProps}
          multiSelectDimension="states"
        />
      );

      expect(screen.getByText('Comparing')).toBeInTheDocument();
    });

    it('should not show Comparing badge when no dimension is selected', () => {
      render(<MobileFilterAccordion {...defaultProps} />);

      expect(screen.queryByText('Comparing')).not.toBeInTheDocument();
    });

    it('should show Comparing badge for categories dimension', () => {
      render(
        <MobileFilterAccordion
          {...defaultProps}
          multiSelectDimension="categories"
        />
      );

      expect(screen.getByText('Comparing')).toBeInTheDocument();
    });

    it('should show Comparing badge for sectors dimension', () => {
      render(
        <MobileFilterAccordion
          {...defaultProps}
          multiSelectDimension="sectors"
        />
      );

      expect(screen.getByText('Comparing')).toBeInTheDocument();
    });
  });

  describe('chevron indicator', () => {
    it('should rotate chevron for expanded section', () => {
      const { container } = render(
        <MobileFilterAccordion {...defaultProps} expandedId="states" />
      );

      const svgs = container.querySelectorAll('svg');
      // First SVG (states section) should have rotate-180
      expect(svgs[0].className.baseVal).toContain('rotate-180');
      // Second SVG (categories section) should not have rotate-180
      expect(svgs[1].className.baseVal).not.toContain('rotate-180');
    });
  });
});
