import AppRoutes from "./routes/AppRoutes";
import ChatWidget from "./components/chat/ChatWidget";

export default function App() {
  return (
    <>
      <AppRoutes />
      <ChatWidget />
    </>
  );
}