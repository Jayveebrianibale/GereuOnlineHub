// ========================================
// ADMIN HOME TAB - ADMIN DASHBOARD WRAPPER
// ========================================
// Ang file na ito ay naghahandle ng admin home tab
// Simple wrapper component na nag-import ng AdminHome dashboard
// Ginagamit sa admin tab navigation

// Import ng AdminHome component
import AdminHome from '../admin-dashboard';

// ========================================
// ADMIN HOME TAB COMPONENT
// ========================================
// Main component na naghahandle ng admin home tab
// Simple wrapper na nag-render ng AdminHome dashboard
export default function AdminHomeTab() {
  return <AdminHome />;
} 