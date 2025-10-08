import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonClass = "bg-red-500 hover:bg-red-600 text-white",
  loading = false,
  disabled = false,
  maxWidth = "max-w-md",
  maxHeight = "max-h-96"
}) => {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative enterprise-modal p-6 ${maxWidth} w-full mx-4 ${maxHeight} overflow-hidden`}
        >
          <div className="h-full flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
            <div className="flex-1 overflow-y-auto">
              {message}
            </div>
            
            <div className="flex space-x-3 justify-end mt-6 pt-4 border-t border-gray-600">
              <button
                onClick={onClose}
                disabled={loading}
                className="enterprise-button-secondary px-4 py-2 disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading || disabled}
                className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${confirmButtonClass}`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading...
                  </div>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default ConfirmationModal
