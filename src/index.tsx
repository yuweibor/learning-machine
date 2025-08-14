import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import App from './App';
import StudyPage from './game/study';
import LevelPage from './game/level';
import WhackAMolePage from './game/whack-a-mole';
import TrialPage from './game/trial';
import './index.css';
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/level" element={<LevelPage />} />
          <Route path="/whack-a-mole" element={<WhackAMolePage />} />
          <Route path="/trial" element={<TrialPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  </React.StrictMode>
);