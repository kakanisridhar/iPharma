import { redirect } from "react-router";
import { AppLayout } from "@/layouts/toplevelnav/app-layout";
import { Login, Dashboard, Error404, GenericError, Sync } from "@/pages";
import { getSetting } from "@/lib/db";
import { createHashRouter } from "react-router";
import { USER_NAME } from "./vars";

async function requireAuth() {
  const userPresent = await getSetting(USER_NAME, null);
  if (!userPresent) throw redirect("/login");
  return null;
}

const router = createHashRouter([
  {
    Component: AppLayout,
    errorElement: <GenericError />,
    loader: requireAuth,
    children: [
      {
        path: "/",
        Component: Dashboard,
      },
      {
        path: "/dashboard",
        Component: Dashboard,
      },
      {
        path: "/admin/sync",
        Component: Sync,
      },
      {
        path: "*",
        Component: Error404,
      },
    ],
  },
  {
    path: "/login",
    Component: Login,
  },
]);

export default router;
