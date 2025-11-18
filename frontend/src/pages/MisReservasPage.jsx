// src/pages/MisReservasPage.jsx
import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import MobileHeader from '../components/layout/MobileHeader';
import MobileSidebar from '../components/layout/MobileSidebar';
import MisReservas from '../components/docente/MisReservas';
import { useAuth } from '../hooks/useAuth';

function MisReservasPage() {
  const { user, role, userData } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background-light">
      {/* Sidebar Desktop */}
      <Sidebar user={user} role={role} />
      
      {/* Mobile Header */}
      <MobileHeader 
        user={user} 
        role={role} 
        userData={userData}
        onMenuClick={() => setMobileSidebarOpen(true)}
      />
      
      {/* Mobile Sidebar */}
      <MobileSidebar 
        user={user} 
        role={role} 
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0 p-4 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <MisReservas />
        </div>
      </main>
    </div>
  );
}

export default MisReservasPage;
