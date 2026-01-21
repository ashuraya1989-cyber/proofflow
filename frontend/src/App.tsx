import { Route, Routes } from "react-router-dom";
import Admin from "./pages/Admin";
import ClientShare from "./pages/ClientShare";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Admin />} />
      <Route path="/share/:token" element={<ClientShare />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
