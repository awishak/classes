// Every class that runs on the shared engine, in one place.
//
// App.jsx resolves routes from this, the front page builds itself from it, and
// the class pickers on the Dashboard and the room screen list it. Adding a
// class is one line here. The registry lives under config/ rather than in
// App.jsx because the Dashboard needs it too, and importing App from the
// Dashboard would be a circle.

import comm999 from "./comm999.js";
import comm118 from "./comm118.js";
import comm2 from "./comm2.js";
import comm3 from "./comm3.js";
import comm4 from "./comm4.js";

// Keyed by the URL segment. /comm118/dashboard -> ENGINE.comm118.
export const ENGINE = { comm999, comm118, comm2, comm3, comm4 };

// The order the class pickers show them in.
export const ENGINE_LIST = [comm118, comm3, comm2, comm4, comm999];

// What the front page does with each one. `status` lives on the config.
export const currentClasses = () => ENGINE_LIST.filter(c => c.status === "current");
export const archivedClasses = () => ENGINE_LIST.filter(c => c.status === "archived");

// Who sees the teaching links at the bottom of the front page. This hides the
// links; it does not lock the surfaces behind them.
export const INSTRUCTOR_EMAILS = ["aishak@scu.edu", "andrewishak@gmail.com"];
