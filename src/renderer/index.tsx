import 'tailwindcss/tailwind.css';
import './global.css';
import { createRoot } from 'react-dom/client';
import App from './App';
import ControlProvider from './provider/ControlProvider';
import DataProvider from './provider/DataProvider';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

root.render(
  <ControlProvider>
    <DataProvider>
      <App />
    </DataProvider>
  </ControlProvider>,
);
