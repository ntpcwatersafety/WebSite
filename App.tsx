import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Contact from './pages/Contact';
import GenericPage from './pages/GenericPage';
import Gallery from './pages/Gallery';
import Admin from './pages/Admin';
import { PAGE_CONTENT, MEDIA_SECTIONS } from './services/cms';
import ThankYou from './pages/ThankYou';
import { getActivityGalleryItems, getGalleryItems, getResultGalleryItems } from './services/cmsLoader';

// 包裝元件：根據路徑決定是否顯示 Navbar 和 Footer
const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin';

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminPage && <Navbar />}
      
      {/* Main Content Area */}
      <div className={`flex-grow ${!isAdminPage ? 'mt-[78px] md:mt-[70px]' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/activities" element={<Gallery key="activities" pageKey="activities" loadItems={getActivityGalleryItems} emptyMessage="目前尚無報名資訊內容。" itemLabel="活動" />} />
          <Route path="/results" element={<Gallery key="results" pageKey="results" loadItems={getResultGalleryItems} emptyMessage="目前尚無訓練成果內容。" itemLabel="成果" />} />
          <Route path="/gallery" element={<Gallery key="gallery" pageKey="gallery" loadItems={getGalleryItems} emptyMessage="目前尚無活動剪影內容。" itemLabel="活動" />} />
          <Route path="/media" element={<GenericPage data={PAGE_CONTENT.media} sections={MEDIA_SECTIONS} />} />
          <Route path="/thankyou" element={<ThankYou />} />
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