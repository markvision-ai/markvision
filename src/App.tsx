import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      {/* Все эти пути теперь ведут в Index, где мы переключим вкладку по URL */}
      <Route path="/dashboard" element={<Index />} />
      <Route path="/realtime" element={<Index />} />
      <Route path="/table" element={<Index />} />
      <Route path="/crm" element={<Index />} />
      <Route path="/diagnostics" element={<Index />} />
      <Route path="/analytics" element={<Index />} />
      <Route path="/finance" element={<Index />} />
      <Route path="/settings" element={<Index />} />
    </Routes>
  </BrowserRouter>
);
export default App;
