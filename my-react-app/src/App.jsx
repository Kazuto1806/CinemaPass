import { Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";

function App() {
  return (
    <Routes>

      {/* TRANG CHỦ */}
      <Route
        path="/"
        element={
          <>
            <Header />
            <Home />
          </>
        }
      />

      {/* TRANG ĐĂNG NHẬP */}
      <Route
        path="/login"
        element={<Login />}
      />

    </Routes>
  );
}

export default App;