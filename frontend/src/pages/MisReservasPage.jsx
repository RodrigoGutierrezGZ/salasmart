// src/pages/MisReservasPage.jsx
import React from 'react';
import Sidebar from '../components/Sidebar';
import MisReservas from '../components/MisReservas';
import { useAuth } from '../hooks/useAuth';

function MisReservasPage() {
  const { user, role } = useAuth();

  return (
    <div className="flex h-screen bg-background-light">
      <Sidebar user={user} role={role} />
      
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-7xl">
          <MisReservas />
        </div>
      </main>
    </div>
  );
}

export default MisReservasPage;
