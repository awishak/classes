// Every class that runs on the shared engine, in one place.
//
// App.jsx resolves routes from this, and the class pickers on the Dashboard and
// the room screen list it, so adding a class means adding one line here rather
// than editing three files. The registry lives under config/ rather than in
// App.jsx because the Dashboard needs it too, and importing App from the
// Dashboard would be a circle.

import comm999 from "./comm999.js";
import comm118 from "./comm118.js";
import comm2 from "./comm2.js";
import comm3 from "./comm3.js";
import comm4 from "./comm4.js";

// Keyed by the URL segment. /comm118/dashboard -> ENGINE.comm118.
export const ENGINE = { comm999, comm118, comm2, comm3, comm4 };

// The order the class pickers show them in: what I teach, then the empty one,
// then the template.
export const ENGINE_LIST = [comm118, comm2, comm4, comm3, comm999];
