import Center from "@/components/common/center";
import { Outlet } from "react-router";
import { Header } from "./header";

function AuthLayout() {
  return (
    <div className="w-full h-[100vh] p-4 bg-background">
      <Center className="flex-col">
        <Header />
        <div className="bg-background">
          <Outlet />
        </div>
      </Center>
    </div>
  );
}

export default AuthLayout;
