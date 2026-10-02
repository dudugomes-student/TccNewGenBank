import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ThemeProvider } from './theme/ThemeProvider';
import './styles/tokens.css';
import './styles/global.css';
import './styles/components.css';
import './styles/routes.css';
import './styles/movement.css';
import './styles/phase7.css';
import './styles/motion.css';
import './styles/responsive.css';
import './styles/vertical-slice.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
