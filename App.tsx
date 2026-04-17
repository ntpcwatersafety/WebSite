import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Contact from './pages/Contact';
import GenericPage from './pages/GenericPage';
import Gallery from './pages/Gallery';
import Admin from './pages/Admin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminIntro from './pages/admin/AdminIntro';
import AdminNews from './pages/admin/AdminNews';
import AdminActivities from './pages/admin/AdminActivities';
import AdminResults from './pages/admin/AdminResults';
import AdminGallery from './pages/admin/AdminGallery';
import AdminMedia from './pages/admin/AdminMedia';
import AdminAwards from './pages/admin/AdminAwards';
import AdminThankYou from './pages/admin/AdminThankYou';
import AdminMediaLibrary from './pages/admin/AdminMediaLibrary';
import { PAGE_CONTENT, MEDIA_SECTIONS } from './services/cms';
import ThankYou from './pages/ThankYou';
import { getActivityGalleryItems, getGalleryItems, getResultGalleryItems } from './services/cmsLoader';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminPage && <Navbar />}

      <div className={`flex-grow ${!isAdminPage ? 'mt-[78px] md:mt-[70px]' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/activities" element={<Gallery key="activities" pageKey="activities" loadItems={getActivityGalleryItems} emptyMessage="目前尚無報名資訊內容。" itemLabel="活動" />} />
          <Route path="/results" element={<Gallery key="results" pageKey="results" loadItems={getResultGalleryItems} emptyMessage="目前尚無訓練成果內容。" itemLabel="成果" />} />
          <Route path="/gallery" element={<Gallery key="gallery" pageKey="gallery" loadItems={getGalleryItems} emptyMessage="目前尚無活動剪影內容。" itemLabel="活動" />} />
          <Route path="/media" element={<GenericPage data={PAGE_CONTENT.media} sections={MEDIA_SECTIONS} />} />
          <Route path="/thankyou" element={<ThankYou />} />
          <Route path="/contact" element={<Contact />} />

          {/* 後台：Admin 是外層 layout（header+toast），AdminDashboard 是內層 layout（側邊選單） */}
          <Route path="/admin" element={<Admin />}>
            <Route element={<AdminDashboard />}>
              <Route index element={<AdminIntro />} />
              <Route path="intro" element={<AdminIntro />} />
              <Route path="news" element={<AdminNews />} />
              <Route path="activities" element={<AdminActivities />} />
              <Route path="results" element={<AdminResults />} />
              <Route path="gallery" element={<AdminGallery />} />
              <Route path="media" element={<AdminMedia />} />
              <Route path="awards" element={<AdminAwards />} />
              <Route path="thankyou" element={<AdminThankYou />} />
              <Route path="medialibrary" element={<AdminMediaLibrary />} />
            </Route>
          </Route>
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
