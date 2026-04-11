import { MenuItemType, MenuType, shopUserMenu } from "@/config/menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { NavLink } from "react-router";
import PageTitle from "@/components/common/page-title";

const AppHeader = () => {
  let menu: MenuType = shopUserMenu;

  return (
    <nav className="flex h-14 items-center justify-between gap-8 px-4 sm:px-6">
      <div className="flex items-center">
        <NavigationMenu viewport={false}>
          <NavigationMenuList>
            {menu.map((item) => (
              <NavItem item={item} key={item.title}></NavItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      <div className="flex-1 flex items-center gap-6">
        <div className="max-w-md flex items-center justify-center">
          <PageTitle title="Test" desc="Hardcoded in layout"></PageTitle>
        </div>
      </div>
    </nav>
  );
};

function NavItem({ item }: { item: MenuItemType }) {
  if (item.subMenu && item.subMenu.length > 0) {
    return (
      <NavigationMenuItem>
        <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent>
          {item.subMenu.map((subItem) => (
            <NavigationMenuLink asChild className="w-32" key={subItem.title}>
              <NavLink
                to={subItem.url || "#"}
                className="hover:bg-muted hover:text-accent-foreground flex select-none flex-row gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors"
              >
                {subItem.title}
              </NavLink>
            </NavigationMenuLink>
          ))}
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  } else {
    return (
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <NavLink to={item.url || "#"} className="flex items-center gap-2">
            {item.title}
          </NavLink>
        </NavigationMenuLink>
      </NavigationMenuItem>
    );
  }
}

export { AppHeader };
