import ReactDOM from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import App from './App';
import './index.css';

// NOTE: StrictMode is intentionally omitted. It double-invokes effects in
// development, which for the mentor session means start → immediate end →
// restart within the same tick. That tears down the LiveKit room + backend
// /avatar/bey/end on the first cleanup and leaves the worker in a confused
// state on reconnect ("job is unresponsive"). Real-time sessions don't
// tolerate that pattern.
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
