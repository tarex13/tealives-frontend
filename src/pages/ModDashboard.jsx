// ModDashboard.jsx

import React, { useEffect, useState } from 'react';
import {
  fetchPendingGroups,
  approveGroup,
  rejectGroup,
  fetchGroupsPendingDeletion,
  finalizeGroupDeletion,
  cancelGroupDeletion,
  fetchPendingAlerts,
  approveAlert
} from '../requests';
import { Helmet } from 'react-helmet-async';
import { useNotification } from '../context/NotificationContext';

export default function ModDashboard() {
  const [pendingGroups, setPendingGroups]   = useState([]);
  const [deletionGroups, setDeletionGroups] = useState([]);
  const [pendingAlerts, setPendingAlerts]   = useState([]);
  const { showNotification }                = useNotification();

  const loadModeratorData = async () => {
    try {
      const [pendingGroupsRes, deletionGroupsRes, pendingAlertsRes] = await Promise.all([
        fetchPendingGroups(),
        fetchGroupsPendingDeletion(),
        fetchPendingAlerts(),
      ]);

      setPendingGroups(Array.isArray(pendingGroupsRes.results) ? pendingGroupsRes.results : []);
      setDeletionGroups(Array.isArray(deletionGroupsRes.results) ? deletionGroupsRes.results : []);
      setPendingAlerts(Array.isArray(pendingAlertsRes.results) ? pendingAlertsRes.results : []);
    } catch (err) {
      console.error('🔥 loadModeratorData error:', err);
      showNotification('Failed to load moderator data.', 'error');
    }
  };

  useEffect(() => {
    loadModeratorData();
  }, []);

  const handleGroupAction = async (actionFn, groupId, successMsg) => {
    try {
      await actionFn(groupId);
      showNotification(successMsg, 'success');
      loadModeratorData();
    } catch (err) {
      console.error('🛑 Group action failed:', err);
      showNotification('Action failed.', 'error');
    }
  };

  const handleAlertApproval = async (alertId) => {
    try {
      await approveAlert(alertId);
      showNotification('Alert approved!', 'success');
      loadModeratorData();
    } catch (err) {
      console.error('🛑 Approve alert failed:', err);
      showNotification('Failed to approve alert.', 'error');
    }
  };

  // Common classes for cards
  const cardBase =
    'w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 flex justify-between items-start';

  const sectionHeader =
    'text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200';

  const itemTitle = 'text-lg font-semibold text-gray-900 dark:text-gray-100';
  const itemText  = 'text-gray-700 dark:text-gray-300';

  const buttonBase =
    'px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';

  const approveBtn =
    'bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600 focus:ring-green-500';
  const rejectBtn =
    'bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500';
  const cancelBtn =
    'bg-yellow-500 hover:bg-yellow-600 text-white dark:bg-yellow-400 dark:hover:bg-yellow-500 focus:ring-yellow-400';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
            <Helmet>
              <title>Moderation | Tealives</title>
            </Helmet>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        Moderator Dashboard
      </h1>

      {/* Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Group Approvals */}
        <section className="space-y-4">
          <h2 className={sectionHeader}>Pending Group Approvals</h2>
          {pendingGroups.length > 0 ? (
            <ul className="space-y-4">
              {pendingGroups.map(group => (
                <li key={group.id} className={cardBase}>
                  <div className="flex-1 space-y-2">
                    <h3 className={itemTitle}>{group.name}</h3>
                    <p className={itemText}>{group.description}</p>
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      className={`${buttonBase} ${approveBtn} w-full`}
                      onClick={() =>
                        handleGroupAction(approveGroup, group.id, 'Group Approved!')
                      }
                    >
                      Approve
                    </button>
                    <button
                      className={`${buttonBase} ${rejectBtn} w-full`}
                      onClick={() =>
                        handleGroupAction(rejectGroup, group.id, 'Group Rejected!')
                      }
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No pending groups.</p>
          )}
        </section>

        {/* Pending Alerts */}
        <section className="space-y-4">
          <h2 className={sectionHeader}>Pending Alerts</h2>
          {pendingAlerts.length > 0 ? (
            <ul className="space-y-4">
              {pendingAlerts.map(alert => (
                <li key={alert.id} className={cardBase}>
                  <div className="flex-1 space-y-2">
                    <h3 className={itemTitle}>{alert.title}</h3>
                    <p className={itemText}>{alert.content}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Priority:{' '}
                      <span className="font-medium">
                        {alert.priority.charAt(0).toUpperCase() + alert.priority.slice(1)}
                      </span>
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      className={`${buttonBase} ${approveBtn}`}
                      onClick={() => handleAlertApproval(alert.id)}
                    >
                      Approve
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No pending alerts.</p>
          )}
        </section>

        {/* Pending Group Deletions */}
        <section className="space-y-4">
          <h2 className={sectionHeader}>Pending Group Deletions</h2>
          {deletionGroups.length > 0 ? (
            <ul className="space-y-4">
              {deletionGroups.map(group => (
                <li key={group.id} className={cardBase}>
                  <div className="flex-1 space-y-2">
                    <h3 className={itemTitle}>{group.name}</h3>
                    <p className={itemText}>{group.description}</p>
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      className={`${buttonBase} ${approveBtn} w-full`}
                      onClick={() =>
                        handleGroupAction(
                          finalizeGroupDeletion,
                          group.id,
                          'Group Permanently Deleted!'
                        )
                      }
                    >
                      Final Delete
                    </button>
                    <button
                      className={`${buttonBase} ${cancelBtn} w-full`}
                      onClick={() =>
                        handleGroupAction(
                          cancelGroupDeletion,
                          group.id,
                          'Deletion Cancelled!'
                        )
                      }
                    >
                      Cancel
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No groups pending deletion.</p>
          )}
        </section>
      </div>
    </div>
  );
}
