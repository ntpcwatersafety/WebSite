import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Contact from './pages/Contact';
import GenericPage from './pages/GenericPage';
import { PAGE_CONTENT, ACTIVITIES_SECTIONS, RESULTS_SECTIONS, GALLERY_SECTIONS, MEDIA_SECTIONS } from './services/cms';

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        
        {/* Main Content Area */}
        <div className="flex-grow mt-[70px]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/activities" element={<GenericPage data={PAGE_CONTENT.activities} sections={ACTIVITIES_SECTIONS} />} />
            <Route path="/results" element={<GenericPage data={PAGE_CONTENT.results} sections={RESULTS_SECTIONS} />} />
            <Route path="/gallery" element={<GenericPage data={PAGE_CONTENT.gallery} sections={GALLERY_SECTIONS} />} />
            <Route path="/media" element={<GenericPage data={PAGE_CONTENT.media} sections={MEDIA_SECTIONS} />} />
            {/* <Route path="/about" element={<GenericPage data={PAGE_CONTENT.about} />} /> */}
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </div>

        <Footer />
      </div>
    </Router>
  );
};

export default App;