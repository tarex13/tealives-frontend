{/*Currently not being used*/}

import React, { useEffect, useState } from 'react';
import { getGroups, createGroup } from '../requests';
import GroupCard from '../components/GroupCard';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

// ✅ Toast Hook Implementation
function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = ({ title = '', duration = 3000 }) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const ToastContainer = () => (
    <div className="fixed top-15 right-4 space-y-2 z-50">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-gray-800 text-white px-4 py-2 rounded shadow-lg animate-fade-in-out"
        >
          {t.title}
        </div>
      ))}
    </div>
  );

  return { toast, ToastContainer };
}

// ✅ UI Placeholder Components
const Button = ({ children, className = '', ...props }) => (
  <button
    {...props}
    className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 ${className}`}
    disabled={props.disabled}
  >
    {children}
  </button>
);

const Input = ({ className = '', ...props }) => (
  <input
    {...props}
    className={`border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 ${className}`}
  />
);

const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={() => onOpenChange(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="bg-white p-6 rounded shadow-lg min-w-[300px]"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children }) => <div>{children}</div>;

const DialogHeader = ({ children }) => (
  <h2 id="dialog-title" className="text-xl font-bold mb-4">
    {children}
  </h2>
);

// ✅ Main GroupsPage Component
export default function GroupsPage() {
  const { user: loggedInUser } = useAuth(); // Correct hook usage
  const [groups, setGroups] = useState([]);
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast, ToastContainer } = useToast();
  
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await getGroups();
      setGroups(response.data.results);
    } catch (err) {
      console.error(err);
      showNotification('Error fetching groups.', 'error');
    }
  };

  const handleCreateGroup = async () => { 
    if (!groupName.trim()) {
      return toast({ title: 'Group name is required.' });
    }
    if (!description.trim()) {
      return toast({ title: 'Description is required.' });
    }
    if (description.length > 200) {
      return toast({ title: 'Description is too long (max 200 characters).' });
    }
  
    const duplicate = groups.some(g => g.name.toLowerCase() === groupName.trim().toLowerCase());
    if (duplicate) {
      return toast({ title: 'A group with this name already exists.' });
    }
  
    try {
      setIsCreating(true);
      const newGroup = await createGroup({ name: groupName.trim(), description: description.trim() });
  
      toast({ title: 'Group created successfully.' });
      setOpen(false);
      setGroupName('');
      setDescription('');
  
      // Update state directly without fetching again
      setGroups(prev => [newGroup, ...prev]);
      setFilteredGroups(prev => [newGroup, ...prev]);
    } catch (err) {
      console.error(err);
      showNotification('Failed to create group.' , 'error');
    } finally {
      setIsCreating(false);
    }
  };
  

  return (
    <div className="p-4">
      <ToastContainer />

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Groups</h1>
        <Button onClick={() => setOpen(true)}>Create Group</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {groups.map((group) => (
          <GroupCard key={group.id} group={group} currentUser={loggedInUser} />
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>Create New Group</DialogHeader>
          <Input
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="mb-2"
          />
          <Input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mb-4"
          />
          <Button
            onClick={handleCreateGroup}
            className="w-full"
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
