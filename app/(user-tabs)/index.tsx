// ========================================
// USER HOME TAB - HOME SCREEN WRAPPER
// ========================================
// Ang file na ito ay naghahandle ng user home tab
// Simple wrapper component na nag-import ng UserHome dashboard
// Ginagamit sa user tab navigation

// Import ng UserHome component
import UserHome from '../user-dashboard';

// ========================================
// USER HOME TAB COMPONENT
// ========================================
// Main component na naghahandle ng user home tab
// Simple wrapper na nag-render ng UserHome dashboard
export default function UserHomeTab() {
  return <UserHome />;
} 