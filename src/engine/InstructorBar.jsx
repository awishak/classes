// The top bar on every page Andrew opens.
//
// Andrew, 2026-09-15: "every page that i access as instructor, including
// grade view, has to have the exact same top nav. every page should have
// that." The class page, the dashboard, the repository and Games draw TopNav
// themselves; every other page is wrapped in this, which draws the same
// TopNav with nothing added: the class, the five tabs and Apps.
//
// `always` is for pages behind the instructor gate, where whoever is looking
// is the instructor. Everywhere else the bar shows only for the instructor's
// own sign-in, so a student on Ask or a board sees the page as before.
//
// The room screen and the presenter window are not wrapped. They are what
// the projector shows, and a bar there is a bar on the wall.

import TopNav, { NAV_CLASS } from "./TopNav.jsx";
import { useSession } from "./session.js";
import { lastClass } from "./InstructorNav.jsx";
import { fontHref } from "./themes.js";

export default function InstructorBar({ config, always = false, children }) {
  const { instructor } = useSession();
  const cls = config || lastClass();
  if (!cls || !(always || instructor)) return children;
  return (
    <>
      <link rel="stylesheet" href={fontHref("clean")} />
      <TopNav config={cls} tabs={NAV_CLASS} active="" />
      {children}
    </>
  );
}
