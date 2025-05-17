import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PostActionMenu = ({ postId, postOwnerId, currentUserId, postOwnerUsername, isAnonymous }) => {
    const [open, setOpen] = useState(false);
    const menuRef = useRef();
    const { user } = useAuth();

    const isOwner = currentUserId === postOwnerId;
    const isAdmin = user?.role === 'admin';
    const isModerator = user?.role === 'moderator';

    const handleClickOutside = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
            setOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNavigation = (url) => {
        window.location.href = url;
    };

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setOpen(!open)} 
                className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
            >
                <MoreHorizontal className="w-5 h-5" />
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-50">
                    <div className="p-1 text-left text-sm">
                        {/* Edit/Delete for Owner, Admin, Mod */}
                        {(isOwner || isAdmin || isModerator) && (
                            <>
                                <button 
                                    onClick={() => console.log('Edit Post')} 
                                    className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                                >
                                    Edit Post
                                </button>
                                <button 
                                    onClick={() => console.log('Delete Post')} 
                                    className="w-full px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-600"
                                >
                                    Delete Post
                                </button>
                            </>
                        )}

                        {/* Pin for Admin/Mod */}
                        {(isAdmin || isModerator) && (
                            <button 
                                onClick={() => console.log('Pin Post')} 
                                className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                                Pin Post
                            </button>
                        )}

                        {/* Chat and View Profile only if Post is NOT Anonymous and User is NOT Owner */}
                        {!isAnonymous && postOwnerId !== currentUserId && (
                            <>
                                <button 
                                    onClick={() => handleNavigation(`/chat/${postOwnerId}`)} 
                                    className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                                >
                                    Chat with {postOwnerUsername}
                                </button>
                                <button 
                                    onClick={() => handleNavigation(`/profile/${postOwnerId}`)} 
                                    className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                                >
                                    View Profile
                                </button>
                            </>
                        )}

                        {/* Report only if Not Owner */}
                        {!isOwner && (
                            <button 
                                onClick={() => console.log('Report Post')} 
                                className="w-full px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                                Report Post
                            </button>
                        )}

                        {/* Hide Always Shown */}
                        <button 
                            onClick={() => console.log('Hide Post')} 
                            className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                            Hide Post
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostActionMenu;
