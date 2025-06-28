// src/pages/BadgeDefinitionsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { fetchBadges, createBadge, updateBadge, deleteBadge, activateBadge, deactivateBadge } from '../api/adminRequests';
import BadgeCard from '../components/Badges/BadgeDefinitions/BadgeCard';
import BadgeFormModal from '../components/Badges/BadgeDefinitions/BadgeFormModal';
import SearchFilterBar from '../components/Badges/BadgeAssignments/SearchFilterBar';
import Modal from '../components/Modal';
import { useNavigate } from 'react-router-dom';
export default function BadgeDefinitionsPage() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [badges, setBadges] = useState([]);
  const [pageInfo, setPageInfo] = useState({ current: 1, total: 1 });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    badge_type: '', // '', 'user', 'seller', 'mod', 'business'
    is_active: '', // '', 'true', 'false'
    search: '',
  });

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (!user.is_admin) {navigate('/auth'); return;}; // only admin
    fetchData(1);
  }, [user, filters]);

  const fetchData = async (page) => {
    setLoading(true);
    try {
      const params = {
        page,
      };
      if (filters.badge_type) params.badge_type = filters.badge_type;
      if (filters.is_active !== '') params.is_active = filters.is_active;
      if (filters.search) params.search = filters.search;
      const data = await fetchBadges(params);
      // expecting paginated response: { results: [...], count, next, previous }
      setBadges(data.results || []);
      // derive total pages if your pagination returns count and page size:
      // assume StandardResultsSetPagination returns page size in settings or in response
      // For simplicity, if backend returns `results` and uses page size 10:
      const pageSize = 10; // adjust to your pagination default
      const total = data.count || (data.results ? data.results.length : 0);
      const totalPages = Math.ceil(total / pageSize);
      setPageInfo({ current: page, total: totalPages });
    } catch (err) {
      console.error(err);
      showNotification('Failed to fetch badges', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (val) => {
    setFilters((f) => ({ ...f, search: val }));
  };
  const handleFilterChange = (name, val) => {
    setFilters((f) => ({ ...f, [name]: val }));
  };

  const openCreateModal = () => {
    setEditingBadge(null);
    setShowFormModal(true);
  };
  const openEditModal = (badge) => {
    setEditingBadge(badge);
    setShowFormModal(true);
  };

  const handleFormSubmit = async (formData, isEdit, id) => {
    try {
      if (isEdit) {
        await updateBadge(id, formData, true);
        showNotification('Badge updated', 'success');
      } else {
        await createBadge(formData);
        showNotification('Badge created', 'success');
      }
      setShowFormModal(false);
      fetchData(pageInfo.current);
    } catch (err) {
      console.error(err);
      showNotification('Failed to save badge', 'error');
    }
  };

  const handleActivateToggle = async (badge) => {
    try {
      if (badge.is_active) {
        await deactivateBadge(badge.id);
        showNotification('Badge deactivated', 'success');
      } else {
        await activateBadge(badge.id);
        showNotification('Badge activated', 'success');
      }
      fetchData(pageInfo.current);
    } catch (err) {
      console.error(err);
      showNotification('Failed to toggle active', 'error');
    }
  };

  const handleDelete = async (badge) => {
    if (!window.confirm(`Delete badge "${badge.name}"? This cannot be undone.`)) return;
    try {
      await deleteBadge(badge.id);
      showNotification('Badge deleted', 'success');
      fetchData(pageInfo.current);
    } catch (err) {
      console.error(err);
      showNotification('Failed to delete badge', 'error');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pageInfo.total) return;
    fetchData(newPage);
  };

  if (!user?.is_admin) {
    return <p className="p-4 text-red-500">Not authorized.</p>;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Badge Definitions</h1>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          + Create Badge
        </button>
      </div>

      <SearchFilterBar
        searchValue={filters.search}
        onSearchChange={handleSearchChange}
        filters={[
          {
            name: 'badge_type',
            label: 'Type',
            options: [
              { value: 'user', label: 'User' },
              { value: 'seller', label: 'Seller' },
              { value: 'mod', label: 'Mod' },
              { value: 'business', label: 'Business' },
            ],
            value: filters.badge_type,
          },
          {
            name: 'is_active',
            label: 'Status',
            options: [
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ],
            value: filters.is_active,
          },
        ]}
        onFilterChange={handleFilterChange}
      />

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : badges.length === 0 ? (
        <p className="text-gray-600">No badges found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              onEdit={openEditModal}
              onActivateToggle={handleActivateToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pageInfo.total > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-4">
          <button
            onClick={() => handlePageChange(pageInfo.current - 1)}
            disabled={pageInfo.current === 1}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-gray-700 dark:text-gray-300">
            Page {pageInfo.current} of {pageInfo.total}
          </span>
          <button
            onClick={() => handlePageChange(pageInfo.current + 1)}
            disabled={pageInfo.current === pageInfo.total}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      <BadgeFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        initialData={editingBadge}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
