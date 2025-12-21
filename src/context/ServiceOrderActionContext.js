'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const ServiceOrderActionContext = createContext();

export function ServiceOrderActionProvider({ children }) {
    const [actions, setActions] = useState([]);

    const registerAction = useCallback((id, component) => {
        setActions(prev => {
            const exists = prev.find(a => a.id === id);
            if (exists) return prev;
            return [...prev, { id, component }];
        });
    }, []);

    const unregisterAction = useCallback((id) => {
        setActions(prev => prev.filter(a => a.id !== id));
    }, []);

    return (
        <ServiceOrderActionContext.Provider value={{ actions, registerAction, unregisterAction }}>
            {children}
        </ServiceOrderActionContext.Provider>
    );
}

export function useServiceOrderActions() {
    return useContext(ServiceOrderActionContext);
}
