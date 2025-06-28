{/*not currently being used*/}

import React, { useEffect, useState } from 'react';
import api from '../api'; // Assuming Axios setup
import { Button } from '@/components/ui/button';

const PinnedContentBar = () => {
    const [pinnedItems, setPinnedItems] = useState([]);
    const [error, setError] = useState('');

    const fetchPinnedContent = async () => {
        try {
            const response = await api.get('pin/'); // API should handle filtering expired content
            setPinnedItems(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching pinned content', err);
            setError('Failed to load pinned content.');
        }
    };

    useEffect(() => {
        fetchPinnedContent();
    }, []);

    if (!pinnedItems.length && !error) return null;

    return (
        <div className="flex overflow-x-auto gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl shadow mb-6">
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}
            {pinnedItems.map(item => (
                <div 
                    key={item.id} 
                    className="min-w-[200px] bg-white dark:bg-gray-700 p-4 rounded-xl shadow cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => window.location.href = `/posts/${item.post}`}
                >
                    <h4 className="font-semibold text-base mb-2 capitalize">{item.post_type}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                        {item.excerpt || 'Pinned content...'}
                    </p>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2 text-blue-500"
                        onClick={() => window.location.href = `/posts/${item.post}`}
                    >
                        View
                    </Button>
                </div>
            ))}
        </div>
    );
};

export default PinnedContentBar;
