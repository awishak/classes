# Grade view as a dashboard: what the reading says

Written 2026-10-18 for the grade view redesign. The options page built from this
is at https://claude.ai/artifact/WuDdopNfoW4pZqqysHZd97. Andrew's ask, verbatim:
"a great dashboard that works for any class to tell me about assignments,
students, work submitted, when work was submitted, what the most common grade
was, sorting students into type so far (completed all work, not doing any work,
high engagement, etc. maybe put them on a 2x2), and really give me lots of
visuals ... when I click on an individual assignment or students, same thing in
my work view. better than grade view."

## What the big gradebooks show

- Canvas Course Analytics: per-assignment class average with one student or
  section overlaid; a students table with On Time percent, last participation,
  page views; Message Students Who (haven't submitted, haven't been graded,
  scored under X, late, missing); the student context card with missing count,
  late count, last ten grades and participation as a word against the class.
  Learning Mastery is the only gradebook that surfaces the mode. Complaints:
  data a day or weeks stale, the per-student graded-activity timeline was
  dropped in New Analytics and people miss it.
- Gradescope: a histogram and stats over the student table; per-question bars;
  item analysis with Hard under 50 percent, Medium 50 to 84, Easy 85 and up;
  grading progress per TA, which UBC's evaluation found the most praised
  analytic ("it feels like a game").
- Brightspace Class Progress: one row per student, four indicator columns,
  bars of the last 15 items; User Progress shows the class distribution with
  the student's dot in it, and arrows step to the next student.
- Blackboard Ultra: Needs Grading with the oldest ungraded submission; Course
  Activity scatter of grade against hours in course, one dot per student,
  purple for anyone with an alert; the student's How Am I Doing shows the
  class average as a band of plus or minus one standard deviation.
- Crowdmark: grading speed per question, time spent grading per team member,
  time to return an assessment.
- Turnitin: a submissions timeline, one bar per day, red for late.
- Moodle: the activity completion grid, student by activity, tick boxes.
- Google Classroom: red missing, green turned in, black returned.

## Learning analytics research

- Course Signals at Purdue: a red, yellow, green light the faculty member set
  by hand and then messaged on. Worked as a communication device; the retention
  claims fell apart (Caulfield, Essa). Lesson: a traffic light the teacher sets
  is fine, a predictive one is not.
- Student Explorer at Michigan put a verb on each colour (students to
  encourage, students to engage with) rather than a noun for the person.
- Loop at Melbourne drew vertical lines for the course's own events on every
  activity chart; per item, a list of students who have not opened it.
- Kizilcec, Piech and Schneider 2013 found the same four trajectories in every
  course: Completing, Auditing, Disengaging, Sampling. Completion alone hides
  who is drifting.
- Papageorgiou et al. 2025 tracked profile switching week to week: effective
  groups stable, low-time groups restless. Movement is itself a signal.
- Ilgun Dibek and Yildirim-Erbasli 2026: Early Starters, Strategic Delayers,
  Last Minute Submitters; time from submission to due date among the strongest
  predictors; not all delay is harmful.
- Dartmouth's Canvas data: median turn-in 30 minutes before due, median late
  turn-in 1.2 hours after. COMM 3 tonight: 78 percent of turn-ins in the last
  24 hours.
- Few 2007: traffic lights are "so damn cute, but their appeal is only skin
  deep"; a dashboard is one screen read overview, then what needs attention,
  then closer, then a launch pad to act.
- Jivet 2017 and 2020: comparison to peers can foster the wrong motive;
  students asked for next steps, not more awareness. Kaliisa et al. 2023 across
  38 studies: dashboards moved participation, not grades, and only when they
  led to an action. Wise and Jung 2019: instructors browse first, explain
  patterns with course context, then act or deliberately wait.
- Ethics: Scholes 2016, Slade and Prinsloo; keep labels internal, name the
  behaviour and not the person, never "at risk" on the screen.

## Visual forms

- Submission timing: a dot strip per assignment with a due line at zero, late
  to the right, dodged so the deadline pile stays readable (FT Visual
  Vocabulary, Observable Plot dodge). The axis should stretch near the due line
  since that is where the class lives.
- Grade spread at n of 60: a dot histogram or beeswarm, every student a
  hoverable dot, the mode as the headline; a bar hides who.
- Completion matrix: a fixed meaning per cell, sorted by what matters, never a
  shade relative to the data (GitHub's grid is the cautionary case).
- 2x2: Blackboard's scatter is the shipping example; keep names on dots.
- One student against the class: Burn-Murdoch's FT small multiples, the crowd
  in grey behind the one line in ink; no average line needed.
- Sparklines per student (Tufte): word-sized, a grey band for the normal range,
  a dot on the latest value; share the y range if they must compare.
- Grading pace: a burndown with an ideal line, plus the oldest ungraded item
  and time to return per assignment.
- Cleveland and McGill 1984: position on a common scale is read most
  accurately, then length, then colour. Dots on a shared axis beat bars beat
  coloured cells.

## Sources

- https://community.canvaslms.com/docs/DOC-16553 (Message Students Who)
- https://community.canvaslms.com/docs/DOC-16538 (Learning Mastery, mode)
- https://blog.smu.edu/itconnect/2017/02/23/canvas-corner-february-edition (context card)
- https://guides.gradescope.com/hc/en-us/articles/22059823947917 (assignment statistics)
- https://elearning5.sites.olt.ubc.ca/files/2021/05/gradescope-report.pdf (UBC evaluation)
- https://www.pcc.edu/instructional-support/tools/d2lbrightspace/tutorials/user-progress/ (Brightspace)
- https://help.anthology.com/blackboard/instructor/en/analytics/course-activity-report.html (Blackboard scatter)
- https://www.crowdmark.com/blog/assessment-analytics-overview/
- https://help.turnitin.com/feedback-studio/managebac/instructor/statistics/learning-analytics-dashboard.htm
- https://docs.moodle.org/en/Activity_completion_report
- https://er.educause.edu/~/media/files/articles/2012/6/cs252bed2011.pdf (Course Signals)
- https://hapgood.us/2013/09/26/why-the-course-signals-math-does-not-add-up/
- https://michigan.it.umich.edu/news/2019/04/19/student-explorer-helps-advisors-target-at-risk-students
- https://doi.org/10.14742/apubs.2015.947 (Loop)
- https://web.stanford.edu/~cpiech/bio/papers/deconstructingDisengagement.pdf (Kizilcec)
- https://learning-analytics.info/index.php/JLA/article/view/8663 (Papageorgiou 2025)
- https://sites.dartmouth.edu/learninganalytics/?p=230 (submission timing)
- https://blogs.ischool.berkeley.edu/i247s13/files/2013/02/WhyMostDashboardsFail.pdf (Few)
- https://www.solaresearch.org/?p=8136 (Jivet 2020)
- https://arxiv.org/pdf/2312.15042 (Kaliisa 2023)
- https://learning-analytics.info/index.php/JLA/article/view/6357 (Wise and Jung)
- https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary
- https://observablehq.com/plot/transforms/dodge
- https://data.europa.eu/apps/data-visualisation-guide/beeswarm-plots
- https://www.datawrapper.de/blog/tables/
- https://kieranhealy.org/blog/archives/2020/03/27/a-covid-small-multiple/
- https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/
- https://edwardtufte.github.io/tufte-css/
