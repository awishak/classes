// The first-week challenge: fill in your card.
//
// Andrew, 2026-09-17: "we make it a task in the first week to fill in their
// info ... need all fields filled. this assignment/challenge has no weight."
//
// The card is the submission. A challenge in the engine is otherwise a thing
// a student turns in, so this one reads the profile instead: every field on
// Your card filled and the challenge marks itself Complete, with nothing to
// send and nothing for Andrew to grade. A class opts in with `profileTask`
// on its config, carrying the due date; the challenge itself lives here, so
// COMM 118's store, which carries its own assignments list, gets it too.

export const PROFILE_TASK_ID = "card";

// Every field on the student's form. All of them, at his call.
export const PROFILE_FIELDS = ["email", "avatar", "about", "year", "hometown", "motto", "goals", "priority", "strength"];

export const profileComplete = (profile) => PROFILE_FIELDS.every(k => String(profile?.[k] || "").trim());

export const isProfileTask = (asg) => asg?.completes === "profile";

export const profileTaskOf = (config) => config?.profileTask ? {
  id: PROFILE_TASK_ID,
  title: "Please tell me about yourself",
  due: config.profileTask.due || "",
  dueTime: config.profileTask.dueTime || "11:59 PM",
  weight: 0,
  scale: "complete",
  completes: "profile",
  description: "",
  instructionsUrl: "",
  rubric: [],
} : null;

// The class's challenges as a student sees them: the store's list over the
// config's, with the card challenge in front when the class asks for it.
export const assignmentsOf = (config, data) => {
  const list = data?.assignments || config?.assignments || [];
  const task = profileTaskOf(config);
  if (!task || list.some(a => a.id === task.id)) return list;
  return [task, ...list];
};
