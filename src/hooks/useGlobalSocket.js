import { useEffect } from "react";
import { useSelector } from "react-redux";
import { socket } from "../socket";

// Registers this user's presence on the shared socket the moment they're
// logged in — mounted once at the app/dashboard level, independent of
// whichever chat view (if any) happens to be open. Without this running
// globally, presence (and therefore canJoinRoom/resolveSocketUserId on the
// gateway) would only exist while some chat component happened to be
// mounted.
const useGlobalSocket = () => {
  const user = useSelector((state) => state.user.userInfo?.user);

  useEffect(() => {
    if (user) {
      const handleConnect = () => {
        socket.emit('registerUser', { userId: user.id });
      };

      socket.connect();
      // If already connected (reconnect scenario), register immediately
      if (socket.connected) {
        socket.emit('registerUser', { userId: user.id });
      }

      socket.on('connect', handleConnect);

      return () => {
        socket.off('connect', handleConnect);
      };
    } else if (socket.connected) {
      socket.disconnect();
    }
  }, [user]);
};

export default useGlobalSocket;
