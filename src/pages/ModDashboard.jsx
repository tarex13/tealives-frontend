import React, { useEffect, useState } from 'react';
import { 
    fetchPendingGroups, approveGroup, rejectGroup,
    fetchGroupsPendingDeletion, finalizeGroupDeletion, cancelGroupDeletion
} from '../requests';
import { useNotification } from '../context/NotificationContext';

export default function ModDashboard() {
    const [pendingGroups, setPendingGroups] = useState([]);
    const [deletionGroups, setDeletionGroups] = useState([]);
    const { showNotification } = useNotification();

    const loadGroups = async () => {
        try {
            const pendingResponse = await fetchPendingGroups();
            const deletionResponse = await fetchGroupsPendingDeletion();
    
            console.log('Raw Pending Response:', pendingResponse);
            console.log('Raw Deletion Response:', deletionResponse);
    
            const pending = Array.isArray(pendingResponse.data.results) ? pendingResponse.data.results : [];
            const pendingDeletion = Array.isArray(deletionResponse.data.results) ? deletionResponse.data.results : [];
    
    
            setPendingGroups(pending);
            setDeletionGroups(pendingDeletion);
        } catch {
            showNotification('Failed to load moderator data.', 'error');
        }
    };
    

    useEffect(() => {
        loadGroups();
    }, []);

    const handleAction = async (actionFn, groupId, successMsg) => {
        try {
            await actionFn(groupId);
            showNotification(successMsg, 'success');
            loadGroups();
        } catch {
            showNotification('Action failed.', 'error');
        }
    };

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-2xl font-bold">Moderator Dashboard</h1>

            {/* Pending Approvals */}
            <section>
                <h2 className="text-xl font-semibold mb-4">Pending Group Approvals</h2>
                {pendingGroups.length ? pendingGroups.map(group => (
                    <div key={group.id} className="p-4 border rounded flex justify-between items-center mb-2 shadow-sm">
                        <div>
                            <h3 className="font-bold">{group.name}</h3>
                            <p className="text-gray-600">{group.description}</p>
                        </div>
                        <div className="space-x-2">
                            <button 
                                className="px-3 py-1 bg-green-500 text-white rounded"
                                onClick={() => handleAction(approveGroup, group.id, 'Group Approved!')}
                            >
                                Approve
                            </button>
                            <button 
                                className="px-3 py-1 bg-red-500 text-white rounded"
                                onClick={() => handleAction(rejectGroup, group.id, 'Group Rejected!')}
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                )) : <p className="text-gray-500">No pending groups.</p>}
            </section>

            {/* Pending Deletion */}
            <section>
                <h2 className="text-xl font-semibold mb-4">Pending Group Deletions</h2>
                {deletionGroups.length ? deletionGroups.map(group => (
                    <div key={group.id} className="p-4 border rounded flex justify-between items-center mb-2 shadow-sm">
                        <div>
                            <h3 className="font-bold">{group.name}</h3>
                            <p className="text-gray-600">{group.description}</p>
                        </div>
                        <div className="space-x-2">
                            <button 
                                className="px-3 py-1 bg-green-500 text-white rounded"
                                onClick={() => handleAction(finalizeGroupDeletion, group.id, 'Group Permanently Deleted!')}
                            >
                                Final Delete
                            </button>
                            <button 
                                className="px-3 py-1 bg-yellow-500 text-white rounded"
                                onClick={() => handleAction(cancelGroupDeletion, group.id, 'Deletion Cancelled!')}
                            >
                                Cancel Deletion
                            </button>
                        </div>
                    </div>
                )) : <p className="text-gray-500">No groups pending deletion.</p>}
            </section>
        </div>
    );
}
