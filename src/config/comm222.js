// COMM 222: the class anyone can look at, no sign-in. Andrew, 2026-10-07: "put
// like a fake class there so people can see what it looks like ... on the same
// templating as whatever we update so it updates along with everything else
// ... a class called COMM 222 that people can look at whenever they want."
//
// It is the template class under another code, rendered by the same engine as
// every real class, so a change to the engine shows up here the same day. The
// `demo` field names the student a visitor looks as: the page opens in the
// preview lens on that name, writes nothing, and never asks for a sign-in.
// Andrew signed in gets his own view and can edit the demo's content like any
// class. Lives at /comm222 here and at the root of clarisa.app (see main.jsx).

import comm999 from "./comm999.js";

const comm222 = {
  ...comm999,

  id: "comm222",
  path: "/comm222",
  code: "COMM 222",
  // The class's name, quarter and room are the template's until Andrew gives
  // the demo its own.
  storageKey: "comm222-demo-v1",

  // On the front page with the running classes, so the demo is one tap from
  // classes.andrewishak.com as well.
  status: "current",
  adminPin: "222333",

  // Who a visitor is while looking. Marty McFly is the class mascot on every
  // roster, fictional, and visible to students, so the view is a student's.
  // He is on the roster here from the start, because the house roster is
  // written by Andrew's page and a visitor's page writes nothing.
  demo: "Marty McFly",
  students: [...comm999.students, { id: "marty-mcfly", name: "Marty McFly", email: "marty@example.test", from: "", goals: "" }],
};

export default comm222;
