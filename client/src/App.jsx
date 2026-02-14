import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ContactList from './components/ContactList';
import ContactDetail from './components/ContactDetail';
import TaskList from './components/TaskList';
import Calendar from './components/Calendar';
import Toast from './components/Toast';

export default function App() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard showToast={showToast} />} />
          <Route path="/contacts" element={<ContactList showToast={showToast} />} />
          <Route path="/contacts/:id" element={<ContactDetail showToast={showToast} />} />
          <Route path="/tasks" element={<TaskList showToast={showToast} />} />
          <Route path="/calendar" element={<Calendar showToast={showToast} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
