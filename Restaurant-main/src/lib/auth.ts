export type UserRole = "main_admin" | "branch_manager" | "customer";

export type AuthUser = {

  id: string;

  name: string;

  email: string;

  role: UserRole;

  branchId?: string;

};

export function defaultRouteForRole(role?: UserRole | string | null) {
  switch (role) {
    case "main_admin":
      return "/admin";


    case "branch_manager":
      return "/branch-manager";

    case "customer":
       return "/menu";

    default:
      return "/login";

  }

}

export function getUnauthorizedRedirect(role?: UserRole | string | null, pathname?: string) {
  if (!role) {

    return "/login";
 }



  if (pathname?.startsWith("/admin")) {
    if (role !== "main_admin") {
      return "/";

    }

  }




  if (pathname?.startsWith("/branch-manager")) {
    if (role !== "branch_manager" && role !== "main_admin") {

      return "/";

    }

  }



  return null;

}

export function isAuthEntryRoute(pathname: string) {
  return pathname === "/login" || pathname === "/admin/login" || pathname === "/signup" || pathname === "/register";

}