import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import jest-dom matchers
import DocToolWrapper from './DocToolWrapper';
import { MemoryRouter } from 'react-router-dom';

// Mocking dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/tools/doc' }),
}));

// Mock props
const defaultProps = {
  toolName: 'Doc Tool',
  sourceFormat: 'DOCX',
  targetFormat: 'PDF',
  processFile: jest.fn(),
  categories: { '主要功能': [{ tools: [{ name: 'Doc Tool' }] }] },
  onBack: jest.fn(),
};

describe('DocToolWrapper UI Logic Tests', () => {
  
  test('HTML Mode: Fixed height and visible overflow', () => {
    const props = { ...defaultProps, sourceFormat: 'HTML', targetFormat: 'PDF' };
    render(
      <MemoryRouter>
        <DocToolWrapper {...props} />
      </MemoryRouter>
    );

    const innerSettingsContainer = screen.getByText('转换选项').closest('div');
    
    expect(innerSettingsContainer).toHaveStyle('height: 500px');
    expect(innerSettingsContainer).toHaveStyle('overflow-y: visible');
  });

  test('HTML Mode: Toggle sections mutual exclusivity', () => {
    const props = { ...defaultProps, sourceFormat: 'HTML', targetFormat: 'PDF' };
    render(
      <MemoryRouter>
        <DocToolWrapper {...props} />
      </MemoryRouter>
    );

    const previewToggle = screen.getByText('预览选项');
    // const cssToggle = screen.getByText('CSS 选项'); // Renamed to 'CSS 处理' in actual component
    const cssToggle = screen.getByText('CSS 处理');

    // Initially closed
    expect(screen.queryByText('转换为源代码 (勾选则输出带高亮的代码 PDF)')).not.toBeInTheDocument();

    // Open Preview
    fireEvent.click(previewToggle);
    expect(screen.getByText('转换为源代码 (勾选则输出带高亮的代码 PDF)')).toBeInTheDocument();

    // Open CSS (should close Preview)
    fireEvent.click(cssToggle);
    expect(screen.queryByText('转换为源代码 (勾选则输出带高亮的代码 PDF)')).not.toBeInTheDocument();
    
    // In CSS section
    expect(screen.getByText('移除脚本')).toBeInTheDocument();
    
    // Close CSS (toggle off)
    fireEvent.click(cssToggle);
    expect(screen.queryByText('移除脚本')).not.toBeInTheDocument();
  });

  test('JSON Mode: Fixed height and auto overflow', () => {
    const props = { ...defaultProps, sourceFormat: 'JSON', targetFormat: 'PDF' };
    render(
      <MemoryRouter>
        <DocToolWrapper {...props} />
      </MemoryRouter>
    );

    const innerSettingsContainer = screen.getByText('转换选项').closest('div');
    
    expect(innerSettingsContainer).toHaveStyle('height: 500px');
    expect(innerSettingsContainer).toHaveStyle('overflow-y: auto');
  });

  test('Other Mode (e.g., DOCX): Auto height and visible overflow', () => {
    const props = { ...defaultProps, sourceFormat: 'DOCX', targetFormat: 'PDF' };
    render(
      <MemoryRouter>
        <DocToolWrapper {...props} />
      </MemoryRouter>
    );

    const innerSettingsContainer = screen.getByText('转换选项').closest('div');
    
    expect(innerSettingsContainer).toHaveStyle('height: auto');
    expect(innerSettingsContainer).toHaveStyle('overflow-y: visible');
  });

});
