import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
const container = document.getElementById('root');
createRoot(container).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
