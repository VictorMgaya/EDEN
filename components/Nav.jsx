"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    title: "Home",
    path: "/",
  },
  {
    title: "analytics",
    path: "/analytics",
  },
  {
    title: "Experts",
    path: "/Experts",
  }
];
const Nav = () => {
  const pathname = usePathname();
  return (
    <nav className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-blue-200 dark:border-gray-700">
      <ul className="flex items-center justify-center gap-8">
        {links.map((link, index) => {
          return (
            <li key={index}>
              <Link
                href={link.path}
                className={`${pathname === link.path ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400" : "text-gray-600 dark:text-gray-400"
                  } capitalize font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-all`}
              >
                {link.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
export default Nav;
