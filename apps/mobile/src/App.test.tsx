import { render } from '@testing-library/react-native';
import App from './App';

test('renders Shellff shell message', () => {
  const { getByText } = render(<App />);
  expect(getByText(/Shellff/)).toBeTruthy();
});
