export interface MenuItemType {
  title: string;
  url?: string;
  subMenu?: MenuItemType[];
}

export type MenuType = MenuItemType[];

export const shopUserMenu: MenuType = [
  {
    title: "Sales",
    subMenu: [
      {
        title: "View Sales",
        url: "/sales/list",
      },
      {
        title: "New Sales",
        url: "/sales/new",
      },
    ],
  },
  {
    title: "Inventory Update",
    subMenu: [
      {
        title: "View Inventory Updates",
        url: "/adjustments/search",
      },
      {
        title: "Inventory Update",
        url: "/adjustments/new",
      },
    ],
  },
  {
    title: "Movements",
    subMenu: [
      {
        title: "Movements To Acknowledge",
        url: "/movements/acknowledge",
      },
      {
        title: "New Movement",
        url: "/movements/new",
      },
      {
        title: "View Movements",
        url: "/movements/search",
      },
    ],
  },
  {
    title: "Reports",
    subMenu: [
      {
        title: "Inventory",
        url: "/reports/inventory",
      },
      {
        title: "Expiring Inventory",
        url: "/reports/inventory/expiring",
      },
      {
        title: "Sales By Product",
        url: "/reports/sales/byproduct",
      },
      {
        title: "Sales Totals",
        url: "/reports/sales/totals",
      },
    ],
  },
  {
    title: "Admin",
    subMenu: [
      {
        title: "Sync",
        url: "/admin/sync",
      },
    ],
  },
];
