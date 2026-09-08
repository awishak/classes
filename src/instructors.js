// Who teaches. An email on this list signs in the same way a student does and
// lands on the front page with every class and the teaching tools, and the
// server trusts a session carrying one of these addresses the way it trusts
// the PIN.
export const INSTRUCTOR_EMAILS = ["andrewishak@gmail.com", "aishak@scu.edu"];

export const isInstructorEmail = (email) =>
  INSTRUCTOR_EMAILS.includes(String(email || "").trim().toLowerCase());
