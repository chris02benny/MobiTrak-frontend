import { useAuth } from '../contexts/AuthContext';
import DriverProfilePage from './driver/ProfilePage';
import BusinessProfilePage from './business/BusinessProfilePage';
import CustomerProfilePage from './customer/CustomerProfilePage';

const ProfilePage = () => {
  const { userRole } = useAuth();

  // Route to appropriate profile page based on user role
  switch (userRole) {
    case 'driver':
      return <DriverProfilePage />;
    case 'business':
      return <BusinessProfilePage />;
    case 'customer':
      return <CustomerProfilePage />;
    default:
      return (
        <div className="min-h-screen bg-bgBlack text-white flex items-center justify-center">
          <div className="enterprise-card p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">Profile Not Available</h2>
            <p className="text-gray-300">Unable to determine user role. Please contact support.</p>
          </div>
        </div>
      );
  }
};

export default ProfilePage;
