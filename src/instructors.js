// Who teaches. An email on this list signs in the same way a student does and
// lands on the front page with every class and the teaching tools, and the
// server trusts a session carrying one of these addresses the way it trusts
// the PIN.
export const INSTRUCTOR_EMAILS = ["andrewishak@gmail.com", "aishak@scu.edu"];

export const isInstructorEmail = (email) =>
  INSTRUCTOR_EMAILS.includes(String(email || "").trim().toLowerCase());

// Where a student books a meeting: Andrew's Calendly page. One calendar for
// every class, so the address lives here rather than in each config. A class
// that carries its own under instructor.schedulingLink wins.
export const SCHEDULING_LINK = "https://calendly.com/andrewishak/meet";

export const schedulingLinkOf = (config) => config?.instructor?.schedulingLink || SCHEDULING_LINK;

// The profile a class shows for its instructor: what the config ships, with
// whatever Andrew has since written about himself over the top. It lives in
// the shared store rather than in a class, because it is the same person in
// every class, and it was only editable by changing the code before this.
export const instructorOf = (config, shared) => ({
  ...(config?.instructor || {}),
  ...Object.fromEntries(Object.entries(shared?.instructor || {}).filter(([, v]) => v !== "" && v != null)),
});
