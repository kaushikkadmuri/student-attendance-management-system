import { useEffect } from "react";

const ConfirmDeleteModal = ({ isOpen, onConfirm, onCancel }) => {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      onClick={onCancel}   // click outside to close
    >
      <div
        onClick={(e) => e.stopPropagation()} // prevent close on popup click
        className="bg-white rounded-lg p-6 w-96 shadow-2xl border
                   transform transition-all duration-200 scale-100"
      >
        <h2 className="text-lg font-semibold mb-3">
          Confirm Deletion
        </h2>

        <p className="text-gray-700 mb-6">
          Are you sure you want to delete this analyst?
          This action cannot be undone.
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;

