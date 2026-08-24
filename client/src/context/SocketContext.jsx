import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    // Connect to Socket.IO server
    const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected:', newSocket.id);
    });

    setSocket(newSocket);

    // Cleanup: disconnect when user logs out or component unmounts
    return () => newSocket.disconnect();
  }, [token]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
