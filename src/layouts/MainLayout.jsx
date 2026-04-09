import { Outlet } from "react-router-dom";

function MainLayout() {
  return (
    <div>
      <header className="text-black ">Navbar</header>

      <main>
        <Outlet />
      </main>

      <footer>Footer</footer>
    </div>
  );
}

export default MainLayout;
