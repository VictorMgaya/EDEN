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
    <nav>
      <ul className="flex items-centre align-middle gap-8">
        {links.map((link, index) => {
          return (
            <li key={index}>
              <Link
                href={link.path}
                className={`${pathname === link.path ? "text-green-100 border-b-2 border-green-100" : ""
                  } capitalize font-medium hover:text-blue-600 translation-all`}
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