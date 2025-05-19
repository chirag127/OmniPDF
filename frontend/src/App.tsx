import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MergePDF from './pages/MergePDF';
import SplitPDF from './pages/SplitPDF';
import CompressPDF from './pages/CompressPDF';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tools" element={<Navigate to="/" replace />} />

        {/* PDF Tool Routes */}
        <Route path="/tools/merge-pdf" element={<MergePDF />} />
        <Route path="/tools/split-pdf" element={<SplitPDF />} />
        <Route path="/tools/compress-pdf" element={<CompressPDF />} />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
