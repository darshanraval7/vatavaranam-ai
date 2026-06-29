import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Vatavaranam AI brand name', () => {
  render(<App />);
  const brandElement = screen.getByText(/Vatavaranam/i);
  expect(brandElement).toBeInTheDocument();
});