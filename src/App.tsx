import AppRouter from "./router/AppRouter";
import { SocketProvider } from "./context/SocketProvider";

function App() {
  return (
    <SocketProvider>
      <AppRouter />
    </SocketProvider>
  );
}

export default App;
