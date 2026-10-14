import { initConsoleFilter } from './utils/consoleFilter.ts';
import { initExtensionBridge } from './utils/extensionBridge.ts';

initConsoleFilter();
initExtensionBridge();

import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
