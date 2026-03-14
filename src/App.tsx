import AppRouter from "./router/AppRouter";
import { SocketProvider } from "./context/SocketProvider";
import "./modules/definitions";

function App() {
  return (
    <SocketProvider>
      <AppRouter />
    </SocketProvider>
  );
}

export default App;
