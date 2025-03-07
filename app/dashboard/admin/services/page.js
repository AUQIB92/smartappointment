"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../../../../components/layouts/AdminLayout";
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";

// Service categories
const SERVICE_CATEGORIES = [
  "General",
  "Consultation",
  "Diagnostic",
  "Preventive",
  "Specialized",
  "Emergency",
  "Surgical",
  "Therapy",
];

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 30,
    price: 0,
    category: "General",
    isActive: true,
  });
  const [errors, setErrors] = useState({});

  // Fetch services
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/services", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.services) {
        setServices(data.services);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (service = null) => {
    if (service) {
      setCurrentService(service);
      setFormData({
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
        category: service.category,
        isActive: service.isActive,
      });
    } else {
      setCurrentService(null);
      setFormData({
        name: "",
        description: "",
        duration: 30,
        price: 0,
        category: "General",
        isActive: true,
      });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenDeleteDialog = (service) => {
    setCurrentService(service);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.duration || formData.duration <= 0) {
      newErrors.duration = "Duration must be greater than 0";
    }

    if (!formData.price || formData.price < 0) {
      newErrors.price = "Price must be a positive number";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      let response;
      const token = localStorage.getItem("token");

      if (currentService) {
        // Update existing service
        response = await fetch(`/api/services/${currentService._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
      } else {
        // Create new service
        response = await fetch("/api/services", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
      }

      const data = await response.json();

      if (response.ok) {
        toast.success(
          currentService
            ? "Service updated successfully"
            : "Service added successfully"
        );
        handleCloseDialog();
        fetchServices();
      } else {
        toast.error(data.error || "Failed to save service");
      }
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error("An error occurred while saving the service");
    }
  };

  const handleDeleteService = async () => {
    if (!currentService) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/services/${currentService._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Service deleted successfully");
        handleCloseDeleteDialog();
        fetchServices();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete service");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("An error occurred while deleting the service");
    }
  };

  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {});

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Services Management</h1>
          <button
            className="btn-primary flex items-center"
            onClick={() => handleOpenDialog()}
          >
            <FaPlus className="mr-2" /> Add New Service
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl text-gray-500 mb-4">No services found</h2>
            <button className="btn-primary" onClick={() => handleOpenDialog()}>
              <FaPlus className="mr-2 inline" /> Add Your First Service
            </button>
          </div>
        ) : (
          Object.entries(servicesByCategory).map(
            ([category, categoryServices]) => (
              <div key={category} className="mb-8">
                <h2 className="text-xl font-semibold mb-4">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryServices.map((service) => (
                    <div
                      key={service._id}
                      className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                        service.isActive ? "" : "opacity-70"
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-lg">{service.name}</h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${
                              service.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {service.isActive ? (
                              <>
                                <FaCheck className="mr-1" /> Active
                              </>
                            ) : (
                              <>
                                <FaTimes className="mr-1" /> Inactive
                              </>
                            )}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-2 text-sm">
                          {service.description}
                        </p>
                        <div className="mt-4 flex justify-between items-center">
                          <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                            {service.duration} min
                          </span>
                          <span className="font-bold text-primary-600">
                            ₹{service.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="border-t border-gray-100 p-2 bg-gray-50 flex justify-end">
                        <button
                          onClick={() => handleOpenDialog(service)}
                          className="p-2 text-blue-600 hover:text-blue-800"
                          aria-label="Edit service"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteDialog(service)}
                          className="p-2 text-red-600 hover:text-red-800 ml-2"
                          aria-label="Delete service"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )
        )}

        {/* Add/Edit Service Dialog */}
        {openDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">
                  {currentService ? "Edit Service" : "Add New Service"}
                </h2>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="p-4">
                  <div className="mb-4">
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="name"
                    >
                      Service Name *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className={`w-full p-2 border rounded ${
                        errors.name ? "border-red-500" : "border-gray-300"
                      }`}
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="description"
                    >
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows="3"
                      className={`w-full p-2 border rounded ${
                        errors.description
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                    ></textarea>
                    {errors.description && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="duration"
                      >
                        Duration (minutes) *
                      </label>
                      <input
                        id="duration"
                        name="duration"
                        type="number"
                        min="1"
                        className={`w-full p-2 border rounded ${
                          errors.duration ? "border-red-500" : "border-gray-300"
                        }`}
                        value={formData.duration}
                        onChange={handleInputChange}
                        required
                      />
                      {errors.duration && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.duration}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="price"
                      >
                        Price (₹) *
                      </label>
                      <input
                        id="price"
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        className={`w-full p-2 border rounded ${
                          errors.price ? "border-red-500" : "border-gray-300"
                        }`}
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                      />
                      {errors.price && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.price}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="category"
                    >
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      className={`w-full p-2 border rounded ${
                        errors.category ? "border-red-500" : "border-gray-300"
                      }`}
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      {SERVICE_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.category}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isActive"
                        className="mr-2"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                      />
                      <span className="text-gray-700 text-sm font-bold">
                        Active
                      </span>
                    </label>
                  </div>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded mr-2 hover:bg-gray-300"
                    onClick={handleCloseDialog}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    {currentService ? "Update" : "Add"} Service
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {openDeleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">Confirm Deletion</h2>
              </div>
              <div className="p-4">
                <p>
                  Are you sure you want to delete the service "
                  {currentService?.name}"? This action cannot be undone.
                </p>
              </div>
              <div className="p-4 border-t bg-gray-50 flex justify-end">
                <button
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded mr-2 hover:bg-gray-300"
                  onClick={handleCloseDeleteDialog}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={handleDeleteService}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
