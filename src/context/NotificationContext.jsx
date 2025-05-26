import React, { createContext, useState, useContext } from 'react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [message, setMessage] = useState('');
    const [type, setType] = useState('info'); // 'info' | 'error' | 'success'

    const showNotification = (msg, msgType = 'info') => {
        setMessage(msg);
        setType(msgType);
        setTimeout(() => setMessage(''), 3000); // Auto-hide after 3s
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {message && (
                <div className={`fixed top-[9vh] right-4 p-3 rounded shadow-lg text-white ${
                    type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                }`}>
                    {message}
                </div>
            )}
        </NotificationContext.Provider>
    );
};
