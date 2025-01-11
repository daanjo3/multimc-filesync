import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import { Provider } from "./components/ui/provider";
import "./input.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider>
      <App />
    </Provider>
  </React.StrictMode>,
);
