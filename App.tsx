import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Contact from './pages/Contact';
import GenericPage from './pages/GenericPage';
import Gallery from './pages/Gallery';
import Admin from './pages/Admin';
import { PAGE_CONTENT, ACTIVITIES_SECTIONS, RESULTS_SECTIONS, MEDIA_SECTIONS } from './services/cms';

// 包裝元件：根據路徑決定是否顯示 Navbar 和 Footer
const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin';

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminPage && <Navbar />}
      
      {/* Main Content Area */}
      <div className={`flex-grow ${!isAdminPage ? 'mt-[70px]' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/activities" element={<GenericPage data={PAGE_CONTENT.activities} sections={ACTIVITIES_SECTIONS} />} />
          <Route path="/results" element={<GenericPage data={PAGE_CONTENT.results} sections={RESULTS_SECTIONS} />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/media" element={<GenericPage data={PAGE_CONTENT.media} sections={MEDIA_SECTIONS} />} />
          {/* <Route path="/about" element={<GenericPage data={PAGE_CONTENT.about} />} /> */}
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>

      {!isAdminPage && <Footer />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;