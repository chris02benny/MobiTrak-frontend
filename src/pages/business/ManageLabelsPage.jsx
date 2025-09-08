import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import DashboardLayout from '../../components/DashboardLayout';
import DashboardCard from '../../components/DashboardCard';
import ConfirmationModal from '../../components/ConfirmationModal';

const ManageLabelsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);
  const [deletingLabel, setDeletingLabel] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#fabb24'
  });

  const predefinedColors = [
    '#fabb24', '#10b981', '#3b82f6', '#f59e0b', 
    '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16',
    '#f97316', '#ec4899', '#6366f1', '#14b8a6'
  ];

  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      const response = await fetch(`http://localhost:5000/labels?business_id=${user.id}`);
      const data = await response.json();
      if (response.ok) {
        setLabels(data.data);
      } else {
        showToast(`Failed to fetch labels: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching labels:', error);
      showToast('Error fetching labels', 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateLabel = async () => {
    if (!formData.name.trim()) {
      showToast('Label name is required', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_id: user.id,
          ...formData
        }),
      });

      const data = await response.json();
      if (response.ok) {
        showToast('Label created successfully!', 'success');
        setShowCreateModal(false);
        setFormData({ name: '', description: '', color: '#fabb24' });
        fetchLabels();
      } else {
        showToast(`Failed to create label: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error creating label:', error);
      showToast('Error creating label', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditLabel = async () => {
    if (!formData.name.trim()) {
      showToast('Label name is required', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/labels/${editingLabel.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        showToast('Label updated successfully!', 'success');
        setShowEditModal(false);
        setEditingLabel(null);
        setFormData({ name: '', description: '', color: '#fabb24' });
        fetchLabels();
      } else {
        showToast(`Failed to update label: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error updating label:', error);
      showToast('Error updating label', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLabel = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/labels/${deletingLabel.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('Label deleted successfully!', 'success');
        setShowDeleteModal(false);
        setDeletingLabel(null);
        fetchLabels();
      } else {
        const data = await response.json();
        showToast(`Failed to delete label: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting label:', error);
      showToast('Error deleting label', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({ name: '', description: '', color: '#fabb24' });
    setShowCreateModal(true);
  };

  const openEditModal = (label) => {
    setEditingLabel(label);
    setFormData({
      name: label.name,
      description: label.description || '',
      color: label.color
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (label) => {
    setDeletingLabel(label);
    setShowDeleteModal(true);
  };

  const sidebarItems = [
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ), 
      label: 'Overview', 
      onClick: () => window.location.href = '/dashboard/business' 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ), 
      label: 'Add Vehicle', 
      onClick: () => window.location.href = '/business/add-vehicle' 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ), 
      label: 'View Vehicles', 
      onClick: () => window.location.href = '/business/vehicles' 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ), 
      label: 'Manage Labels', 
      onClick: () => {} 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ), 
      label: 'Driver Management', 
      onClick: () => window.location.href = '/business/drivers' 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ), 
      label: 'Analytics', 
      onClick: () => {} 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ), 
      label: 'Maintenance', 
      onClick: () => {} 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ), 
      label: 'Reports', 
      onClick: () => {} 
    },
  ];

  return (
    <DashboardLayout title="Manage Labels" sidebarItems={sidebarItems}>
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a href="/dashboard/business" className="text-gray-400 hover:text-primary transition-colors">
                Dashboard
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-1 text-gray-400 md:ml-2">Manage Labels</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Vehicle Labels</h1>
          <p className="text-gray-400">Organize your vehicles with custom labels and categories</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openCreateModal}
          className="enterprise-button px-6 py-3 flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Create Label</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {labels.map((label) => (
            <motion.div
              key={label.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DashboardCard className="p-6 hover:bg-white/15 transition-all duration-300 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white/20"
                      style={{ backgroundColor: label.color }}
                    />
                    <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                      {label.name}
                    </h3>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(label)}
                      className="p-2 text-gray-400 hover:text-primary transition-colors"
                      title="Edit label"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => openDeleteModal(label)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete label"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {label.description && (
                  <p className="text-gray-300 text-sm mb-4">{label.description}</p>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Created</span>
                  <span className="text-gray-300">
                    {new Date(label.created_at).toLocaleDateString()}
                  </span>
                </div>
              </DashboardCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {labels.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">��️</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Labels Yet</h3>
          <p className="text-gray-400 mb-6">Create your first label to organize your vehicles</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openCreateModal}
            className="enterprise-button px-6 py-3"
          >
            Create Your First Label
          </motion.button>
        </div>
      )}

      <ConfirmationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={handleCreateLabel}
        title="Create New Label"
        message={
          <div className="space-y-4">
            <div>
              <label htmlFor="create-name" className="block text-sm font-medium text-gray-300 mb-2">
                Label Name *
              </label>
              <input
                type="text"
                id="create-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="enterprise-input w-full"
                placeholder="e.g., Luxury Cars"
                required
              />
            </div>
            <div>
              <label htmlFor="create-description" className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="create-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="enterprise-input w-full h-20 resize-none"
                placeholder="Optional description for this label"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Color
              </label>
              <div className="grid grid-cols-6 gap-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color ? 'border-white scale-110' : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        }
        confirmText="Create Label"
        cancelText="Cancel"
        confirmButtonClass="bg-primary hover:bg-primary/80 text-black"
        loading={loading}
      />

      <ConfirmationModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onConfirm={handleEditLabel}
        title="Edit Label"
        message={
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-300 mb-2">
                Label Name *
              </label>
              <input
                type="text"
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="enterprise-input w-full"
                placeholder="e.g., Luxury Cars"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-description" className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="enterprise-input w-full h-20 resize-none"
                placeholder="Optional description for this label"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Color
              </label>
              <div className="grid grid-cols-6 gap-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color ? 'border-white scale-110' : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        }
        confirmText="Update Label"
        cancelText="Cancel"
        confirmButtonClass="bg-primary hover:bg-primary/80 text-black"
        loading={loading}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteLabel}
        title="Delete Label"
        message={`Are you sure you want to delete the label "${deletingLabel?.name}"? This action cannot be undone and will remove the label from all associated vehicles.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-500 hover:bg-red-600 text-white"
        loading={loading}
      />
    </DashboardLayout>
  );
};

export default ManageLabelsPage;