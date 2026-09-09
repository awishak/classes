// COMM 3 — Digital Storytelling, Fall 2026. The term, generated from the
// September 8 handoff: the calendar, the story bank, and Andrew's ratings.
//
// Three things live here and comm3.js pulls them in:
//
//   scheduleWeeks   the weeks students see, with the due dates as items
//   assignments     the graded pieces and their weights
//   dayPlans        one plan per class day, seeded into the store for any day
//                   that has nothing yet; a day edited on the dashboard wins
//
// A day plan is freeform with two sections. "Lesson plan" holds one item
// whose body is how the day runs. "Stories" holds every story rated great
// for that week, split between Monday and Wednesday by which question the
// story answers, each carrying the move, why the story teaches the skill,
// what happened, and every link from the bank. The links are searches, the
// same ones the bank has. The goods sit on the week's lesson plan as a bench.
//
// Rated by title rather than number, because the ratings file has 1.12 and
// 1.13 swapped against the bank. Regenerate rather than hand-edit.

export const scheduleWeeks = [
  {
    "id": "w1",
    "topic": "Identifying stories and framing",
    "dates": [
      "Sep 21",
      "Sep 23",
      "Sep 25"
    ],
    "text": "What makes something a story, and how does the same event become different stories depending on who is telling it? Exercise due Sunday, September 27.",
    "plan": "On the bench: 1.11 The Willie Horton ad, 1.2 Fyre Festival, told twice, 1.3 Covington Catholic, 1.5 Tonya Harding and Nancy Kerrigan, 1.10 The Menendez brothers, 1993 and 2024.",
    "slides": "",
    "items": [
      {
        "id": "i-w1-0",
        "libId": "lib-w1-0",
        "type": "assignment",
        "title": "Due Sunday, Sep 27: identifying stories and framing exercise",
        "url": "",
        "date": "Fri"
      }
    ]
  },
  {
    "id": "w2",
    "topic": "Visual language",
    "dates": [
      "Sep 28",
      "Sep 30",
      "Oct 2"
    ],
    "text": "How do angle, distance, framing, and editing change what a photograph or a clip says? Exercise due Sunday, October 4.",
    "plan": "On the bench: 2.7 The Los Angeles fires.",
    "slides": "",
    "items": [
      {
        "id": "i-w2-1",
        "libId": "lib-w2-1",
        "type": "assignment",
        "title": "Due Sunday, Oct 4: visual language exercise",
        "url": "",
        "date": "Fri"
      }
    ]
  },
  {
    "id": "w3",
    "topic": "Graphics",
    "dates": [
      "Oct 5",
      "Oct 7",
      "Oct 9"
    ],
    "text": "What can a graphic show that words cannot, and how do graphics mislead? Visual story pre-production due Friday. Exercise due Sunday, October 11.",
    "plan": "On the bench: 3.1 The Ever Given in the Suez Canal, 3.2 The Baltimore Key Bridge collapse, 3.3 The Challenger O-ring charts, 3.6 The Boeing 737 MAX door plug, 3.9 The Panama Papers, 3.12 The HOLC redlining maps, 3.20 Chart crimes.",
    "slides": "",
    "items": [
      {
        "id": "i-w3-2",
        "libId": "lib-w3-2",
        "type": "assignment",
        "title": "Due today: visual story pre-production",
        "url": "",
        "date": "Fri"
      },
      {
        "id": "i-w3-3",
        "libId": "lib-w3-3",
        "type": "assignment",
        "title": "Due Sunday, Oct 11: graphics exercise",
        "url": "",
        "date": "Fri"
      }
    ]
  },
  {
    "id": "w4",
    "topic": "Narrative arc",
    "dates": [
      "Oct 12",
      "Oct 14",
      "Oct 16"
    ],
    "text": "What are the parts of a story, and how does a deadline turn events into one? Visual story due Sunday, October 18.",
    "plan": "On the bench: 4.2 The Thai cave rescue, 4.3 Kendrick Lamar and Drake, 4.4 The Titan submersible, 4.5 Notre Dame, burning and reopening, 4.7 Hawk Tuah, 4.13 The Deepwater Horizon spillcam, 4.14 Baby Jessica in the well, 4.15 Free Britney, 4.17 Leicester City.",
    "slides": "",
    "items": [
      {
        "id": "i-w4-4",
        "libId": "lib-w4-4",
        "type": "assignment",
        "title": "Due Sunday, Oct 18: visual story",
        "url": "",
        "date": "Fri"
      }
    ]
  },
  {
    "id": "w5",
    "topic": "Characters",
    "dates": [
      "Oct 19",
      "Oct 21",
      "Oct 23"
    ],
    "text": "What turns a person into a character, and who decides who the hero is? Exercise due Sunday, October 25.",
    "plan": "On the bench: 5.12 The Biden debate.",
    "slides": "",
    "items": [
      {
        "id": "i-w5-5",
        "libId": "lib-w5-5",
        "type": "assignment",
        "title": "Due Sunday, Oct 25: characters exercise",
        "url": "",
        "date": "Fri"
      }
    ]
  },
  {
    "id": "w6",
    "topic": "Audio quality",
    "dates": [
      "Oct 26",
      "Oct 28",
      "Oct 30"
    ],
    "text": "How does the recording itself change what people hear, and what do we owe the people we record? No class Monday; work on your treatment. Audio story pre-production due Friday. Exercise due Sunday, November 1.",
    "plan": "On the bench: 6.4 S-Town.",
    "slides": "",
    "items": [
      {
        "id": "i-w6-6",
        "libId": "lib-w6-6",
        "type": "assignment",
        "title": "Due today: audio story pre-production",
        "url": "",
        "date": "Fri"
      },
      {
        "id": "i-w6-7",
        "libId": "lib-w6-7",
        "type": "assignment",
        "title": "Due Sunday, Nov 1: audio exercise",
        "url": "",
        "date": "Fri"
      }
    ]
  },
  {
    "id": "w7",
    "topic": "Audience and platform",
    "dates": [
      "Nov 2",
      "Nov 4",
      "Nov 6"
    ],
    "text": "How do you identify who a story is for, and what happens when a different audience finds it? Audio story due Sunday, November 8.",
    "plan": "On the bench: 7.1 New Coke, 7.2 The Blair Witch Project, 7.10 Wrexham, 7.20 Spanish-language local news in California.",
    "slides": "",
    "items": [
      {
        "id": "i-w7-8",
        "libId": "lib-w7-8",
        "type": "assignment",
        "title": "Due Sunday, Nov 8: audio story",
        "url": "",
        "date": "Fri"
      }
    ]
  },
  {
    "id": "w8",
    "topic": "The final project",
    "dates": [
      "Nov 9",
      "Nov 11",
      "Nov 13"
    ],
    "text": "What the final asks, which stories are worth the final, and how to shoot video. Groups form Wednesday.",
    "plan": "",
    "slides": "",
    "items": []
  },
  {
    "id": "w9",
    "topic": "Pitches and production",
    "dates": [
      "Nov 16",
      "Nov 18",
      "Nov 20"
    ],
    "text": "Groups pitch Monday. No class Wednesday or Friday, and no class Thanksgiving week. Groups work on the final.",
    "plan": "",
    "slides": "",
    "items": []
  },
  {
    "id": "w10",
    "topic": "Editing and presentations",
    "dates": [
      "Nov 30",
      "Dec 2",
      "Dec 4"
    ],
    "text": "How to edit video. Groups present Wednesday and submit pre-production that night. Friday is a workshop.",
    "plan": "",
    "slides": "",
    "items": [
      {
        "id": "i-w10-9",
        "libId": "lib-w10-9",
        "type": "assignment",
        "title": "Due tonight: final pre-production",
        "url": "",
        "date": "Wed"
      }
    ]
  },
  {
    "id": "w11",
    "topic": "Finals",
    "dates": [
      "Dec 9"
    ],
    "text": "Final project due Wednesday, December 9.",
    "plan": "",
    "slides": "",
    "items": [
      {
        "id": "i-w11-10",
        "libId": "lib-w11-10",
        "type": "assignment",
        "title": "Due today: final project",
        "url": "",
        "date": "Wed"
      }
    ]
  }
];

export const library = [
  {
    "id": "lib-w1-0",
    "type": "assignment",
    "title": "Due Sunday, Sep 27: identifying stories and framing exercise",
    "url": ""
  },
  {
    "id": "lib-w2-1",
    "type": "assignment",
    "title": "Due Sunday, Oct 4: visual language exercise",
    "url": ""
  },
  {
    "id": "lib-w3-2",
    "type": "assignment",
    "title": "Due today: visual story pre-production",
    "url": ""
  },
  {
    "id": "lib-w3-3",
    "type": "assignment",
    "title": "Due Sunday, Oct 11: graphics exercise",
    "url": ""
  },
  {
    "id": "lib-w4-4",
    "type": "assignment",
    "title": "Due Sunday, Oct 18: visual story",
    "url": ""
  },
  {
    "id": "lib-w5-5",
    "type": "assignment",
    "title": "Due Sunday, Oct 25: characters exercise",
    "url": ""
  },
  {
    "id": "lib-w6-6",
    "type": "assignment",
    "title": "Due today: audio story pre-production",
    "url": ""
  },
  {
    "id": "lib-w6-7",
    "type": "assignment",
    "title": "Due Sunday, Nov 1: audio exercise",
    "url": ""
  },
  {
    "id": "lib-w7-8",
    "type": "assignment",
    "title": "Due Sunday, Nov 8: audio story",
    "url": ""
  },
  {
    "id": "lib-w10-9",
    "type": "assignment",
    "title": "Due tonight: final pre-production",
    "url": ""
  },
  {
    "id": "lib-w11-10",
    "type": "assignment",
    "title": "Due today: final project",
    "url": ""
  }
];

export const assignments = [
  {
    "id": "ex1",
    "title": "Exercise 1: identifying stories and framing",
    "due": "Sep 27",
    "weight": 3,
    "description": "Applies the week's skill to something from your own life and something from the world. Individual. Low stakes on its own, but a student who skips these will not do well in the course. Covers both identifying a story and framing one.",
    "instructionsUrl": "",
    "rubric": []
  },
  {
    "id": "ex2",
    "title": "Exercise 2: visual language",
    "due": "Oct 4",
    "weight": 3,
    "description": "Applies the week's skill to something from your own life and something from the world. Individual. Low stakes on its own, but a student who skips these will not do well in the course.",
    "instructionsUrl": "",
    "rubric": []
  },
  {
    "id": "ex3",
    "title": "Exercise 3: graphics",
    "due": "Oct 11",
    "weight": 3,
    "description": "Applies the week's skill to something from your own life and something from the world. Individual. Low stakes on its own, but a student who skips these will not do well in the course. Two graphics on an assigned topic.",
    "instructionsUrl": "",
    "rubric": []
  },
  {
    "id": "ex4",
    "title": "Exercise 4: characters",
    "due": "Oct 25",
    "weight": 3,
    "description": "Applies the week's skill to something from your own life and something from the world. Individual. Low stakes on its own, but a student who skips these will not do well in the course. A character from your own life and one from the world.",
    "instructionsUrl": "",
    "rubric": []
  },
  {
    "id": "ex5",
    "title": "Exercise 5: audio",
    "due": "Nov 1",
    "weight": 3,
    "description": "Applies the week's skill to something from your own life and something from the world. Individual. Low stakes on its own, but a student who skips these will not do well in the course.",
    "instructionsUrl": "",
    "rubric": []
  },
  {
    "id": "visual",
    "title": "Visual story",
    "due": "Oct 18",
    "weight": 20,
    "description": "Pairs. About 500 words, four or five photographs, and two or three graphics, interspersed. Pre-production, including the treatment, is due Friday, October 9: what the story is, why, and a few sources. I approve the treatment or send the treatment back. Phones are fine. Strong photography can earn extra credit. AI graphics are allowed, with less control; Flourish is the alternative.",
    "instructionsUrl": "",
    "rubric": []
  },
  {
    "id": "audio",
    "title": "Audio story",
    "due": "Nov 8",
    "weight": 20,
    "description": "Pairs. An audio story, modeled on the audio assignment in Lotta's version of the course. Pre-production, including the treatment, is due Friday, October 30. Length and spec to come.",
    "instructionsUrl": "",
    "rubric": []
  },
  {
    "id": "final",
    "title": "Final project",
    "due": "Dec 9",
    "weight": 35,
    "description": "Groups of four. Video, audio, and multimedia together, on a research-based social justice story. Groups pitch Monday, November 16, and present Wednesday, December 2. Pre-production is due the night of the presentations. Lengths and group formation to come.",
    "instructionsUrl": "",
    "rubric": []
  },
  {
    "id": "culture",
    "title": "Class culture",
    "due": "Dec 9",
    "weight": 10,
    "description": "How you show up for the room across the quarter. What earns the ten percent is still being written.",
    "instructionsUrl": "",
    "rubric": []
  }
];

export const dayPlans = {
  "Sep 21": {
    "sequenceId": "__freeform",
    "title": "What makes something a story at all?",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-sep21-plan",
            "text": "How the day runs",
            "bodyOverride": "First day, so the first ten minutes are the syllabus, the two sections, the Sunday deadlines, and Friday office talks in the room. Then the Sycamore Gap tree. Give them the facts flat: a tree on Hadrian's Wall got cut down overnight in September 2023 and a country grieved for a week. Ask whether that's a story. Make both sides defend the answer, and write the reasons on the board as they come. The list they build is the definition of a story: somebody recognizable, a change, a loss, a villain nobody can name yet. Close by pointing at Wednesday, when the same event gets told two ways. Hand out the exercise so they can read the prompt before the workshop.",
            "links": []
          }
        ]
      },
      "sec-stories": {
        "title": "Stories",
        "items": [
          {
            "id": "c3-sep21-s0",
            "text": "1.8 The Sycamore Gap tree (2023)",
            "bodyOverride": "The move. Give them the facts with no framing and ask whether this is a story. Make them defend it either way.\n\nWhy. This is your best case for the question of what even counts as a story. A tree got sustained national coverage and public grief in a week when plenty of people died with no coverage at all. Students have to argue about why, and the answers get at recognizability, symbolism, images, and the fact that a story needs a shape.\n\nWhat happened. A single sycamore standing in a dip along Hadrian's Wall in northern England, well known from a Kevin Costner film and from countless photographs, was cut down overnight with a chainsaw. It led national news in the UK for days. People left flowers. There was a police investigation, arrests, and eventually convictions. No person was harmed.",
            "links": [
              {
                "id": "c3-sep21-s0-l0",
                "label": "See: The tree before and after",
                "url": "https://www.google.com/search?tbm=isch&q=Sycamore+Gap+tree+before+and+after+felled"
              },
              {
                "id": "c3-sep21-s0-l1",
                "label": "Watch: News coverage",
                "url": "https://www.youtube.com/results?search_query=Sycamore+Gap+tree+felled+news+coverage+reaction"
              },
              {
                "id": "c3-sep21-s0-l2",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Sycamore+Gap+tree"
              }
            ]
          }
        ]
      }
    }
  },
  "Sep 23": {
    "sequenceId": "__freeform",
    "title": "How does the same event become different stories?",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-sep23-plan",
            "text": "How the day runs",
            "bodyOverride": "Katrina first, captions covered. Ask what's happening in each photo, then reveal the captions and let the room sit with the fact that neither caption is a lie. That's framing. The frame did the work before anyone needed a false word. Then the Trump story, two outlets, same action, one calling the move strength and one calling the move chaos. Ask them to find the exact words and shots that carry the frame. End with a campus version, still to pick: something SCU did this month, and they frame the same fact two ways in one sentence each. Remind them the exercise is due Sunday and Friday is the workshop.",
            "links": []
          }
        ]
      },
      "sec-stories": {
        "title": "Stories",
        "items": [
          {
            "id": "c3-sep23-s0",
            "text": "1.1 The Katrina photo captions (2005)",
            "bodyOverride": "The move. Put both images up with captions covered. Ask what is happening in each. Then reveal the captions.\n\nWhy. This is the entire concept of framing delivered in two sentences and two images, with no context required. Students see it instantly. It also introduces the harder idea underneath: neither photographer lied, and neither caption is factually disprovable on its face. The frame did the work, not the falsehood.\n\nWhat happened. Two news photographs from flooded New Orleans ran within a day of each other. One, from the Associated Press, showed a young Black man wading through water with a bag and was captioned as looting a grocery store. The other, from Agence France-Presse, showed two white residents in almost identical water with almost identical bags and was captioned as finding food. Both wire services defended their wording. The pairing spread online within days and became one of the most cited examples of racial framing in American journalism.",
            "links": [
              {
                "id": "c3-sep23-s0-l0",
                "label": "See: Both photos side by side",
                "url": "https://www.google.com/search?tbm=isch&q=hurricane+katrina+looting+finding+food+photo+captions+comparison"
              },
              {
                "id": "c3-sep23-s0-l1",
                "label": "Read: Background on the controversy",
                "url": "https://en.wikipedia.org/w/index.php?search=Hurricane+Katrina+media+coverage+looting+finding"
              }
            ]
          },
          {
            "id": "c3-sep23-s1",
            "text": "1.12 The same Trump action, framed two ways (any given week)",
            "bodyOverride": "The move. Two headlines side by side, outlets hidden. Ask what happened. Then ask which one is right. Then reveal the outlets and ask again.\n\nWhy. Katrina is the clean version of framing with the politics removed. This is the same lesson with the politics put back in, on a subject every student in the room already has a position on. It works precisely because they will notice the frame on the side they disagree with immediately and struggle to see it on their own side. That struggle is the lesson.\n\nWhat happened. Pick one thing the President did in the week before class. A signed order, a firing, a post, a trip. Find how two outlets on opposite sides covered it: the headline, the photograph chosen, the first sentence, and the word used for the action itself. The facts will match. Almost nothing else will. Every outlet involved would say it was reporting accurately.\n\nPolitically live.",
            "links": [
              {
                "id": "c3-sep23-s1-l0",
                "label": "See: Two headlines on the same action, updated weekly",
                "url": "https://www.google.com/search?tbm=isch&q=Trump+news+headline+comparison+same+story+different+outlets"
              },
              {
                "id": "c3-sep23-s1-l1",
                "label": "Read: Background on outlet positioning",
                "url": "https://en.wikipedia.org/w/index.php?search=Media+bias+in+the+United+States+news+outlets+political+leaning"
              }
            ]
          }
        ]
      }
    }
  },
  "Sep 25": {
    "sequenceId": "__freeform",
    "title": "Workshop for the identifying stories and framing exercise.",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-sep25-plan",
            "text": "How the day runs",
            "bodyOverride": "Workshop. No lecture. They work on the exercise in the room and come up to talk through drafts. Keep the two Wednesday stories on the screen for anyone who needs the model again. Walk the room for the first twenty minutes, then sit and take office talks. Exercise is due Sunday night.",
            "links": []
          }
        ]
      }
    }
  },
  "Sep 28": {
    "sequenceId": "__freeform",
    "title": "How do angle, distance, framing, and treatment change what a photograph says?",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-sep28-plan",
            "text": "How the day runs",
            "bodyOverride": "Start with the O.J. Simpson Time cover next to the Newsweek one. Ask what's different. Someone gets the answer in four seconds, and the point is that only the treatment changed. Then Vucci's raised fist: show several frames from the burst and ask why this one and why the frame before was passed over. Put the Situation Room photo next to the Vucci one and ask which is better made, and make them define better. Falling Man for what a picture is for and who decides an image is too much. If there's time, Exxon Valdez: read the numbers aloud, then show one otter. Ask which they'll remember next week. Exercise prompt goes out today.",
            "links": []
          }
        ]
      },
      "sec-stories": {
        "title": "Stories",
        "items": [
          {
            "id": "c3-sep28-s0",
            "text": "1.7 The O.J. Simpson Time cover (1994)",
            "bodyOverride": "The move. Show the two covers with no explanation and ask what is different. Someone will get it in about four seconds.\n\nWhy. It is framing in a single visual variable, with the control group sitting right next to it. Nothing was added or removed from the photograph. Only the treatment changed, and the meaning changed with it.\n\nWhat happened. Time and Newsweek both put Simpson's police booking photograph on the cover of the same week's issue. Newsweek ran it unaltered. Time commissioned an illustrator to rework it, and the resulting image was noticeably darker and more shadowed. Because the two magazines sat side by side on newsstands, the difference was impossible to miss. Time's managing editor published a response defending the choice as artistic interpretation.\n\nViolence, abuse or death is the subject.",
            "links": [
              {
                "id": "c3-sep28-s0-l0",
                "label": "See: Both covers together",
                "url": "https://www.google.com/search?tbm=isch&q=Time+Newsweek+OJ+Simpson+cover+1994+comparison+darkened"
              },
              {
                "id": "c3-sep28-s0-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=O.+J.+Simpson+murder+case+media+coverage+Time+cover"
              }
            ]
          },
          {
            "id": "c3-sep28-s1",
            "text": "2.11 Evan Vucci's raised fist photograph (2024)",
            "bodyOverride": "The move. Show several frames from the sequence, not just the famous one. Ask why this one and not the frame before it.\n\nWhy. Composition under maximum pressure, and every element in it is a craft decision made in about two seconds. Angle, the flag placement, the moment chosen out of a burst. It is also the most recent proof that a single frame can outrun everything written about the same event.\n\nWhat happened. An Associated Press photographer covering a rally in Butler, Pennsylvania made an image seconds after gunfire, of Donald Trump with blood on his face, fist raised, surrounded by agents, with the flag above. Vucci has described moving to get a clean angle in the middle of it. It ran worldwide within hours and became a campaign image, a merchandise image, and eventually a statue.\n\nPolitically live. Violence, abuse or death is the subject.",
            "links": [
              {
                "id": "c3-sep28-s1-l0",
                "label": "See: The photograph and others from the same burst",
                "url": "https://www.google.com/search?tbm=isch&q=Evan+Vucci+Trump+Butler+rally+photograph+AP+raised+fist"
              },
              {
                "id": "c3-sep28-s1-l1",
                "label": "Watch: Vucci describing how he made it",
                "url": "https://www.youtube.com/results?search_query=Evan+Vucci+AP+photographer+interview+Trump+rally+photo+how+he+shot+it"
              }
            ]
          },
          {
            "id": "c3-sep28-s2",
            "text": "2.12 The Situation Room photograph (2011)",
            "bodyOverride": "The move. Put it next to the Vucci photograph. Ask which one is better made, and make them define better.\n\nWhy. The opposite lesson from the Vucci image. Nothing here is composed to standard, and the failures of composition are what make it read as real. Together the two photographs let you argue about whether good visual craft means control or means giving it up.\n\nWhat happened. White House photographer Pete Souza made an image of President Obama, Hillary Clinton, and staff watching the Bin Laden raid from a small side room. It is cramped, badly lit, and nobody is centered. The President is off to the side in a folding chair. It became one of the most viewed photographs on the internet at the time.\n\nPolitically live.",
            "links": [
              {
                "id": "c3-sep28-s2-l0",
                "label": "See: The photograph",
                "url": "https://www.google.com/search?tbm=isch&q=Situation+Room+photograph+Pete+Souza+2011+bin+Laden+raid"
              },
              {
                "id": "c3-sep28-s2-l1",
                "label": "Watch: Souza on making it",
                "url": "https://www.youtube.com/results?search_query=Pete+Souza+Situation+Room+photo+how+it+was+taken+interview"
              }
            ]
          },
          {
            "id": "c3-sep28-s3",
            "text": "2.9 The Falling Man (2001)",
            "bodyOverride": "The move. Discuss the withdrawal decision. Ask who made it, on what grounds, and whether anyone voted on it.\n\nWhy. Ties directly to your 9/11 week. It raises the question of what an image is for and who gets to decide it is too much, and it makes visible an editing decision that was made almost invisibly and nationally.\n\nWhat happened. Richard Drew of the Associated Press photographed a man falling from the North Tower. It ran widely on September 12 and then almost vanished, pulled after complaints that it was exploitative. Esquire published a long piece in 2003 about the photograph, the attempt to identify the man, and why American outlets stopped running it while foreign ones did not.\n\nViolence, abuse or death is the subject.",
            "links": [
              {
                "id": "c3-sep28-s3-l0",
                "label": "Read: Background and the Esquire piece",
                "url": "https://en.wikipedia.org/w/index.php?search=The+Falling+Man+photograph+Richard+Drew"
              },
              {
                "id": "c3-sep28-s3-l1",
                "label": "Watch: The 2006 documentary",
                "url": "https://www.youtube.com/results?search_query=The+Falling+Man+documentary+2006"
              }
            ]
          },
          {
            "id": "c3-sep28-s4",
            "text": "2.2 The Exxon Valdez otter and bird photographs (1989)",
            "bodyOverride": "The move. Read the statistics aloud first. Then show one photo. Ask which one they will remember next week.\n\nWhy. A demonstration that one photograph can outperform every number in the story. Useful for arguing with your own week three material, since it suggests the picture sometimes beats the chart.\n\nWhat happened. A tanker ran aground in Prince William Sound and spilled roughly 11 million gallons of crude oil. The volume, the coastline mileage, and the cleanup cost were all reported thoroughly. What lodged in public memory was a small number of photographs of oiled sea otters and seabirds. Those images drove legislation.",
            "links": [
              {
                "id": "c3-sep28-s4-l0",
                "label": "See: The oiled wildlife images",
                "url": "https://www.google.com/search?tbm=isch&q=Exxon+Valdez+oil+spill+oiled+sea+otter+bird+photographs+1989"
              },
              {
                "id": "c3-sep28-s4-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Exxon+Valdez+oil+spill"
              }
            ]
          }
        ]
      }
    }
  },
  "Sep 30": {
    "sequenceId": "__freeform",
    "title": "How does editing change what we think we saw?",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-sep30-plan",
            "text": "How the day runs",
            "bodyOverride": "Rodney King at speed, then slowed. Ask whether slowing something down makes the footage more true or less. Heavy, so say so before pressing play. Then Astroworld: a reconstruction that stacks angles, and the question of what any single angle would have missed. NFL Films against a raw broadcast feed of the same kind of play, which is the fun one: what did the frame rate and the music add? Free Solo last, behind the scenes before the climbing, so every shot reads as a choice. Close with the exercise: they're doing the same thing with a phone this week.",
            "links": []
          }
        ]
      },
      "sec-stories": {
        "title": "Stories",
        "items": [
          {
            "id": "c3-sep30-s0",
            "text": "2.1 The Rodney King tape (1991)",
            "bodyOverride": "The move. Play it at speed, then slowed. Ask whether slowing something down makes it more true or less.\n\nWhy. The founding case of citizen video, and also the founding case of what an edit can do to one. The same footage produced two opposite conclusions depending on speed and framing. This is the week's hardest and most important example.\n\nWhat happened. A man named George Holliday filmed Los Angeles police beating a Black motorist from his apartment balcony. The tape ran nationally and seemed unambiguous. At trial, the defense played it frame by frame, slowed and stilled, arguing each individual blow as a reasonable response. The officers were acquitted, and Los Angeles burned.\n\nViolence, abuse or death is the subject.",
            "links": [
              {
                "id": "c3-sep30-s0-l0",
                "label": "Watch: The original footage as broadcast",
                "url": "https://www.youtube.com/results?search_query=George+Holliday+Rodney+King+video+1991+news+broadcast"
              },
              {
                "id": "c3-sep30-s0-l1",
                "label": "Watch: How the defense used it",
                "url": "https://www.youtube.com/results?search_query=Rodney+King+trial+defense+frame+by+frame+analysis"
              },
              {
                "id": "c3-sep30-s0-l2",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Rodney+King"
              }
            ]
          },
          {
            "id": "c3-sep30-s1",
            "text": "2.3 Astroworld (2021)",
            "bodyOverride": "The move. Show a reconstruction that stacks multiple angles. Ask what any single angle would have missed.\n\nWhy. Modern events are covered from a hundred amateur cameras at once, and journalism now includes assembling those into a coherent visual account. It shows students that the angle you happen to have determines the story you can tell.\n\nWhat happened. A crowd crush at Travis Scott's festival in Houston killed ten people. Because the audience was full of phones, the event was documented from dozens of angles simultaneously, including from inside the crush. Investigators, lawyers, and journalists reconstructed the timeline largely from that footage. The official account and the phone footage did not always agree.\n\nViolence, abuse or death is the subject.",
            "links": [
              {
                "id": "c3-sep30-s1-l0",
                "label": "Watch: Visual reconstruction of the timeline",
                "url": "https://www.youtube.com/results?search_query=Astroworld+crowd+crush+visual+investigation+timeline+reconstruction"
              },
              {
                "id": "c3-sep30-s1-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Astroworld+Festival+crowd+crush"
              }
            ]
          },
          {
            "id": "c3-sep30-s2",
            "text": "2.10 NFL Films house style (1960s onward)",
            "bodyOverride": "The move. Play an NFL Films clip, then the same kind of play on a raw broadcast feed. Ask what the craft added.\n\nWhy. Perfect for you given the sport background, and it is the cleanest example of craft creating meaning. Nothing in a football game is inherently mythic. Frame rate, lens, and score make it so, and you can strip those away in class and watch the myth disappear.\n\nWhat happened. NFL Films built a recognizable visual and audio grammar for football: slow motion at high frame rates, low camera angles, tight lenses on faces and hands, orchestral scoring, and a deep narration voice. Almost every sports highlight package made since borrows from it. The company was for decades run by a father and son, Ed and Steve Sabol, who were explicit that they were making myth rather than reportage.",
            "links": [
              {
                "id": "c3-sep30-s2-l0",
                "label": "Watch: A classic NFL Films segment",
                "url": "https://www.youtube.com/results?search_query=NFL+Films+classic+segment+Steve+Sabol+slow+motion+narration"
              },
              {
                "id": "c3-sep30-s2-l1",
                "label": "Watch: How the style was built",
                "url": "https://www.youtube.com/results?search_query=NFL+Films+Steve+Sabol+how+they+filmed+football+documentary"
              },
              {
                "id": "c3-sep30-s2-l2",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=NFL+Films"
              }
            ]
          },
          {
            "id": "c3-sep30-s3",
            "text": "2.8 Free Solo (2018)",
            "bodyOverride": "The move. Show the behind the scenes segment before the climbing footage. Reverses the usual order and makes the shots visible as choices.\n\nWhy. The only film on this list where the crew narrates its own shot decisions and the ethics behind them. It turns cinematography from a technical topic into a decision-making topic, which is what you actually want them to learn.\n\nWhat happened. A documentary following Alex Honnold's ropeless climb of El Capitan. The filmmakers, themselves climbers, discuss on camera the problem that their presence might distract him and that they might be filming a death. They make explicit decisions about camera placement partly on that basis, including keeping operators off certain pitches.",
            "links": [
              {
                "id": "c3-sep30-s3-l0",
                "label": "Watch: Trailer",
                "url": "https://www.youtube.com/results?search_query=Free+Solo+2018+documentary+trailer"
              },
              {
                "id": "c3-sep30-s3-l1",
                "label": "Watch: The crew discussing camera placement",
                "url": "https://www.youtube.com/results?search_query=Free+Solo+behind+the+scenes+camera+crew+ethics+filming+Honnold"
              },
              {
                "id": "c3-sep30-s3-l2",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Free+Solo+film"
              }
            ]
          }
        ]
      }
    }
  },
  "Oct 2": {
    "sequenceId": "__freeform",
    "title": "Workshop for the visual language exercise.",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-oct2-plan",
            "text": "How the day runs",
            "bodyOverride": "Workshop. They shoot or edit in the room, and I look at photos. The thing to push on: what did you decide, and what would the picture say from the other angle. Exercise due Sunday. Sort pairs for the visual story, since pre-production is due next Friday.",
            "links": []
          }
        ]
      }
    }
  },
  "Oct 5": {
    "sequenceId": "__freeform",
    "title": "What can a graphic show that words cannot?",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-oct5-plan",
            "text": "How the day runs",
            "bodyOverride": "John Snow first, as a table of deaths. Then the map. Ask what changed. The Underground map next to the real geography: which one would you want on the platform? The warming stripes with no explanation: what does this say, and is this a chart at all? You Draw It on the whiteboard, no technology, five minutes. Spotify Wrapped, which they've all consumed: what makes a card work, then design one for something other than music. End on The Pudding. Walk through one essay and say their visual story is a smaller version of this. Show Flourish as the tool, and say AI graphics are allowed with less control.",
            "links": []
          }
        ]
      },
      "sec-stories": {
        "title": "Stories",
        "items": [
          {
            "id": "c3-oct5-s0",
            "text": "3.14 John Snow's cholera map (1854)",
            "bodyOverride": "The move. Give them the death list as a table first. Then give them the map. Ask what changed.\n\nWhy. The origin story of the field, and it is structured as a detective story, so it teaches arc at the same time. It also shows the specific thing a map does that a list cannot: it puts data in space.\n\nWhat happened. During a cholera outbreak in Soho, London, a physician plotted deaths as marks on a street map and saw them cluster around one water pump on Broad Street. The prevailing theory blamed bad air. The map made a spatial pattern visible that no table of numbers had, and the pump handle was removed.",
            "links": [
              {
                "id": "c3-oct5-s0-l0",
                "label": "See: The map",
                "url": "https://www.google.com/search?tbm=isch&q=John+Snow+cholera+map+1854+Broad+Street+pump"
              },
              {
                "id": "c3-oct5-s0-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=John+Snow+cholera+Broad+Street+pump+map"
              }
            ]
          },
          {
            "id": "c3-oct5-s1",
            "text": "3.22 The London Underground map (1933)",
            "bodyOverride": "The move. Show the real geography next to the diagram. Ask which one they would rather have on a platform.\n\nWhy. The clearest case that accuracy and usefulness are different goals and that a designer can trade one for the other on purpose. Every student has used a version of this map and never registered that it is a lie about geography.\n\nWhat happened. Harry Beck, an engineering draftsman, redrew the Underground map as a circuit diagram. He discarded geographic accuracy, straightened lines to horizontals, verticals, and diagonals, and enlarged the crowded center. The transit authority thought it was too radical and printed a small trial run. It became the template for transit maps everywhere.",
            "links": [
              {
                "id": "c3-oct5-s1-l0",
                "label": "See: The map, and a geographically accurate version",
                "url": "https://www.google.com/search?tbm=isch&q=Harry+Beck+London+Underground+map+1933+versus+geographic+accurate"
              },
              {
                "id": "c3-oct5-s1-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Harry+Beck+Tube+map"
              }
            ]
          },
          {
            "id": "c3-oct5-s2",
            "text": "3.8 The warming stripes (2018)",
            "bodyOverride": "The move. Show it with no explanation and ask what it says. Then ask whether it is a chart at all.\n\nWhy. The extreme end of compression. It removes everything a chart normally has and still communicates. Useful for asking what a graphic owes the viewer and what it can leave out.\n\nWhat happened. A climate scientist named Ed Hawkins made an image of roughly 170 vertical stripes, one per year, colored from blue to red by average temperature. No axes, no numbers, no labels. It spread onto book covers, buildings, football kits, and car liveries.",
            "links": [
              {
                "id": "c3-oct5-s2-l0",
                "label": "See: The stripes",
                "url": "https://www.google.com/search?tbm=isch&q=warming+stripes+Ed+Hawkins+climate+graphic"
              },
              {
                "id": "c3-oct5-s2-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Warming+stripes"
              }
            ]
          },
          {
            "id": "c3-oct5-s3",
            "text": "3.16 You Draw It (2015 onward)",
            "bodyOverride": "The move. Draw empty axes on the board. Have them draw the line. Then reveal the data.\n\nWhy. A graphic that makes the reader do something before it tells them anything, which is a completely different theory of what a chart is for. You can run the mechanic on a whiteboard in five minutes with no technology.\n\nWhat happened. A New York Times interactive format where the reader is given the axes and asked to draw the line themselves before the real data is revealed. The first one asked people to predict outcomes by family income. Most readers draw it wrong, and the gap between the guess and the truth is the point of the piece.",
            "links": [
              {
                "id": "c3-oct5-s3-l0",
                "label": "Watch: The format",
                "url": "https://www.youtube.com/results?search_query=New+York+Times+You+Draw+It+interactive+chart+explained"
              },
              {
                "id": "c3-oct5-s3-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=The+Upshot+New+York+Times+interactive+journalism"
              }
            ]
          },
          {
            "id": "c3-oct5-s4",
            "text": "3.4 Spotify Wrapped (2016 onward)",
            "bodyOverride": "The move. Ask what makes a Wrapped card work. Then ask them to design one for something that is not music.\n\nWhy. The one example on this list they have all personally consumed without ever thinking of it as a genre. It is data visualization, narrative sequencing, platform design, and audience psychology in one artifact, and they already have opinions about it.\n\nWhat happened. Every December, Spotify turns a year of a user's listening into a sequence of animated, shareable cards. It is personal data storytelling designed for vertical screens and built to be posted. Competitors have copied it. In recent years it has also drawn complaints when the data felt thin or the design felt off.",
            "links": [
              {
                "id": "c3-oct5-s4-l0",
                "label": "Watch: Wrapped design and reactions",
                "url": "https://www.youtube.com/results?search_query=Spotify+Wrapped+design+how+it+works+data+storytelling"
              },
              {
                "id": "c3-oct5-s4-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Spotify+Wrapped"
              }
            ]
          },
          {
            "id": "c3-oct5-s5",
            "text": "3.15 The Pudding (2017 onward)",
            "bodyOverride": "The move. Pick one essay and walk the class through what each element is doing. Then say their assignment is a smaller version of this.\n\nWhy. This is the closest thing that exists to what you are asking students to make in the multimedia assignment. Text plus photos plus graphics, in service of one argument. It should probably be the model you show them rather than only a story you discuss.\n\nWhat happened. A small publication that produces only visual essays, each one combining original data analysis, custom graphics, scrolling interaction, and written argument. Subjects range from the vocabulary of rappers to who talks in film dialogue to the geography of dive bars. Every piece is free and most credit a small named team.",
            "links": [
              {
                "id": "c3-oct5-s5-l0",
                "label": "Watch: Their work",
                "url": "https://www.youtube.com/results?search_query=The+Pudding+visual+essay+data+journalism+examples"
              },
              {
                "id": "c3-oct5-s5-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=The+Pudding+data+journalism+publication"
              }
            ]
          }
        ]
      }
    }
  },
  "Oct 7": {
    "sequenceId": "__freeform",
    "title": "How do graphics mislead, and what do we owe the people reading them?",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-oct7-plan",
            "text": "How the day runs",
            "bodyOverride": "The hurricane cone. Show the cone and ask who's in danger. The room gets the answer wrong, then explain. Theranos next: a pitch visual, and the question of what is claimed against what is only implied. Strava, for the lighter version of the same lesson: ask what their own data would reveal on a map. Du Bois last. Three plates, no context, ask when they were made. Nobody says 1900. Then the point: made as an argument by the people the data was about, which is the power and privilege outcome sitting inside a graphics week. Pre-production for the visual story is due Friday. Say what a treatment is: what the story is, why, and a few sources.",
            "links": []
          }
        ]
      },
      "sec-stories": {
        "title": "Stories",
        "items": [
          {
            "id": "c3-oct7-s0",
            "text": "3.19 The hurricane cone of uncertainty (ongoing)",
            "bodyOverride": "The move. Show the cone and ask who is in danger. Watch the class get it wrong. Then explain.\n\nWhy. A well-intentioned, technically correct graphic that is systematically misread by millions of people, with lives attached. It teaches that a chart is only as good as what the viewer takes from it, which is a lesson students building their own will need.\n\nWhat happened. The National Hurricane Center publishes a forecast graphic showing a cone that widens with time. The cone represents the likely track of the storm center, not the area that will be affected, and not storm intensity. Research has consistently found that the public reads it as the danger zone, so people just outside the cone believe they are safe. The agency has revised the graphic repeatedly.",
            "links": [
              {
                "id": "c3-oct7-s0-l0",
                "label": "See: The cone and the misreading problem",
                "url": "https://www.google.com/search?tbm=isch&q=hurricane+cone+of+uncertainty+graphic+misinterpretation"
              },
              {
                "id": "c3-oct7-s0-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Tropical+cyclone+forecast+cone+of+uncertainty"
              }
            ]
          },
          {
            "id": "c3-oct7-s1",
            "text": "3.5 The Theranos charts and demonstrations (2003 to 2018)",
            "bodyOverride": "The move. Show a Theranos pitch visual. Ask what it is claiming and what it is only implying.\n\nWhy. The dark version of this week's skill. Every technique that makes a graphic persuasive can make a false thing look true. Students should see the persuasion machinery working before they build their own.\n\nWhat happened. A blood testing startup valued at nine billion dollars claimed to run hundreds of tests from a finger prick. It could not. Investor materials, conference slides, and demonstrations were built to persuade. Validation reports were presented with pharmaceutical company logos on them that those companies had not authorized. The company collapsed after Wall Street Journal reporting, and its founder was convicted of fraud.",
            "links": [
              {
                "id": "c3-oct7-s1-l0",
                "label": "Watch: The Inventor documentary trailer",
                "url": "https://www.youtube.com/results?search_query=The+Inventor+Out+for+Blood+in+Silicon+Valley+trailer+Theranos"
              },
              {
                "id": "c3-oct7-s1-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Theranos"
              }
            ]
          },
          {
            "id": "c3-oct7-s2",
            "text": "3.18 The Strava heatmap (2018)",
            "bodyOverride": "The move. Ask what their own data would reveal if someone mapped it.\n\nWhy. A graphic that revealed something nobody intended to publish. It teaches that data visualization is an act of disclosure, and it is genuinely funny, which buys attention in a dense week.\n\nWhat happened. A fitness app published a global map of aggregated user activity. In remote parts of Afghanistan, Syria, and elsewhere, glowing running loops appeared in otherwise empty terrain, apparently revealing the layout and patrol routes of military and intelligence sites, because personnel were wearing fitness trackers. A university student noticed it and posted about it.",
            "links": [
              {
                "id": "c3-oct7-s2-l0",
                "label": "See: The heatmap and the discovery",
                "url": "https://www.google.com/search?tbm=isch&q=Strava+global+heatmap+2018+military+bases+revealed"
              },
              {
                "id": "c3-oct7-s2-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Strava+heat+map+military+base+security"
              }
            ]
          },
          {
            "id": "c3-oct7-s3",
            "text": "3.11 W.E.B. Du Bois at the Paris Exposition (1900)",
            "bodyOverride": "The move. Show three of them with no context and ask when they were made. Nobody will say 1900.\n\nWhy. It is beautiful, it is over a century old, it looks contemporary, and it was made as an argument by people the data was about. That last part is the whole of your power and privilege outcome delivered inside a graphics week.\n\nWhat happened. Du Bois and a team of students from Atlanta University produced dozens of hand-drawn charts on Black American life for the Paris world's fair. They are in gouache and ink, use spirals, stacked bars, and colors nobody was using for data at the time, and were built to argue against the scientific racism on display elsewhere at the same fair.",
            "links": [
              {
                "id": "c3-oct7-s3-l0",
                "label": "See: The charts",
                "url": "https://www.google.com/search?tbm=isch&q=W.E.B.+Du+Bois+Paris+Exposition+1900+data+portraits+charts"
              },
              {
                "id": "c3-oct7-s3-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=W.+E.+B.+Du+Bois+Paris+Exposition+data+visualizations"
              }
            ]
          }
        ]
      }
    }
  },
  "Oct 9": {
    "sequenceId": "__freeform",
    "title": "Workshop for the visual story. Pre-production due.",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-oct9-plan",
            "text": "How the day runs",
            "bodyOverride": "Workshop. Pairs bring treatments and I approve or send back on the spot where I can. Anything I can't get to today comes back by Monday. Graphics exercise is due Sunday.",
            "links": []
          }
        ]
      }
    }
  },
  "Oct 12": {
    "sequenceId": "__freeform",
    "title": "What are the parts of a story, and what order do they come in?",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-oct12-plan",
            "text": "How the day runs",
            "bodyOverride": "Chilean miners on the board as I tell the story: the collapse, the note at day 17, the long middle, the rescue one man at a time. Ask where the midpoint is and why the note is a false ending. Then Apollo 13: ask what the story is about, and watch the goal get abandoned ten minutes in. Draw the arc under the first one and compare. A campus story with a shape like this would make a good third; still to find. Visual stories are due Sunday, so ask where the arc is in theirs.",
            "links": []
          }
        ]
      },
      "sec-stories": {
        "title": "Stories",
        "items": [
          {
            "id": "c3-oct12-s0",
            "text": "4.1 The Chilean miners (2010)",
            "bodyOverride": "The move. Map the arc on the board as you tell it. Ask where the midpoint is and why the note is not the ending.\n\nWhy. The most legible arc in modern news. Inciting incident, a false floor at day 17, a long middle with a defined obstacle, and an ending that arrived one person at a time with built in repetition. If you want to teach arc with a real story rather than a diagram, this is it.\n\nWhat happened. Thirty three miners were trapped 2,300 feet underground after a collapse. For 17 days nobody knew if they were alive. Then a probe came back with a note attached. They stayed down for 69 days while a rescue shaft was drilled, and were pulled up one at a time in a narrow capsule, broadcast live to an audience estimated at a billion people.",
            "links": [
              {
                "id": "c3-oct12-s0-l0",
                "label": "Watch: The rescue broadcast",
                "url": "https://www.youtube.com/results?search_query=Chilean+miners+rescue+2010+live+broadcast+first+miner"
              },
              {
                "id": "c3-oct12-s0-l1",
                "label": "See: The note from below",
                "url": "https://www.google.com/search?tbm=isch&q=Chilean+miners+note+estamos+bien+en+el+refugio+los+33"
              },
              {
                "id": "c3-oct12-s0-l2",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=2010+Copiap%C3%B3+mining+accident"
              }
            ]
          },
          {
            "id": "c3-oct12-s1",
            "text": "4.19 Apollo 13 (1970)",
            "bodyOverride": "The move. Ask what the story is about. It is not about going to the moon, and it stops being about that ten minutes in.\n\nWhy. The story every rescue narrative since has copied, including the two you already rated. It also has a clean structural feature worth teaching: the mission's original goal is abandoned in act one and replaced by a different one.\n\nWhat happened. An oxygen tank ruptured about 56 hours into a lunar mission, and the crew used the lunar module as a lifeboat to get home. Public interest in Apollo had dropped sharply after the first landing. The accident brought the audience back. The line about a problem, the carbon dioxide filter improvised from onboard materials, and the reentry blackout are all fixed points in how it gets retold.",
            "links": [
              {
                "id": "c3-oct12-s1-l0",
                "label": "Watch: The mission and the coverage",
                "url": "https://www.youtube.com/results?search_query=Apollo+13+mission+1970+coverage+NASA+rescue"
              },
              {
                "id": "c3-oct12-s1-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Apollo+13"
              }
            ]
          }
        ]
      }
    }
  },
  "Oct 14": {
    "sequenceId": "__freeform",
    "title": "How does a deadline turn events into a story?",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-oct14-plan",
            "text": "How the day runs",
            "bodyOverride": "Boston Marathon manhunt, two arcs in parallel on the board: the police one with a deadline, and the Reddit one with no deadline and no editors. Ask which one had an ending. Then the admissions scandal: ask where the story ends, and take all four answers, one per defendant group. Close on the visual story: the deadline is Sunday, and the ending they choose is a decision.",
            "links": []
          }
        ]
      },
      "sec-stories": {
        "title": "Stories",
        "items": [
          {
            "id": "c3-oct14-s0",
            "text": "4.12 The Boston Marathon manhunt (2013)",
            "bodyOverride": "The move. Track the two arcs on the board in parallel. Ask which one had editors.\n\nWhy. A tight, real-time arc with a hard deadline, and a second arc running alongside it made by an audience that thought it was helping. Given your first-year students and their instinct to solve things online, that second arc is the one worth teaching.\n\nWhat happened. Two bombs at the finish line killed three people and injured hundreds. Over roughly 102 hours the FBI released surveillance images, an officer was killed, one suspect died in a shootout, and the second was found in a boat in a backyard. During the same window, users on Reddit and elsewhere publicly named innocent people as suspects, including a missing student who was later found dead by suicide. The site's general manager apologized.\n\nViolence, abuse or death is the subject.",
            "links": [
              {
                "id": "c3-oct14-s0-l0",
                "label": "Watch: The timeline",
                "url": "https://www.youtube.com/results?search_query=Boston+Marathon+bombing+manhunt+timeline+2013"
              },
              {
                "id": "c3-oct14-s0-l1",
                "label": "Read: The Reddit misidentification",
                "url": "https://en.wikipedia.org/w/index.php?search=Reddit+Boston+Marathon+bombing+misidentification+apology"
              }
            ]
          },
          {
            "id": "c3-oct14-s1",
            "text": "4.20 The college admissions scandal (2019)",
            "bodyOverride": "The move. Ask where the story ends. There are at least four defensible answers, one per defendant group.\n\nWhy. An ensemble arc with a clean inciting incident and a spread of endings rather than one. It is also close to your students' own lives in a way most of this list is not, since it is about the process they just went through.\n\nWhat happened. Federal prosecutors charged dozens of wealthy parents, coaches, and a consultant named Rick Singer in a scheme involving falsified test scores and fabricated athletic recruiting profiles. Two well known actresses were among those charged. The case broke in a single day with a large indictment and resolved over months of pleas and short sentences.",
            "links": [
              {
                "id": "c3-oct14-s1-l0",
                "label": "Watch: Overview",
                "url": "https://www.youtube.com/results?search_query=Operation+Varsity+Blues+college+admissions+scandal+explained"
              },
              {
                "id": "c3-oct14-s1-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=2019+college+admissions+bribery+scandal"
              }
            ]
          }
        ]
      }
    }
  },
  "Oct 16": {
    "sequenceId": "__freeform",
    "title": "Workshop for the visual story.",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-oct16-plan",
            "text": "How the day runs",
            "bodyOverride": "Workshop. Pairs bring the draft, all 500 words, photos placed, graphics in. I read for where the story turns and whether the photographs are doing work the words can't. Due Sunday night.",
            "links": []
          }
        ]
      }
    }
  },
  "Oct 19": {
    "sequenceId": "__freeform",
    "title": "What turns a person into a character?",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-oct19-plan",
            "text": "How the day runs",
            "bodyOverride": "Elizabeth Holmes first: inventory the persona on the board, wardrobe, voice, biography, props, and ask what each one did. Richard Jewell: tell the hero version and stop. Then keep going. Ask what evidence caused the turn. The answer is none; he fit a profile. Balloon Boy to end, because the performance breaks on camera and they can name the second. Campus version, still to pick: someone everyone on campus knows, and what they've been cast as. Exercise goes out: a character from their own life and one from the world.",
            "links": []
          }
        ]
      },
      "sec-stories": {
        "title": "Stories",
        "items": [
          {
            "id": "c3-oct19-s0",
            "text": "5.7 Elizabeth Holmes (2003 to 2022)",
            "bodyOverride": "The move. List the components of the persona on the board. Ask what each one was doing.\n\nWhy. Character construction as an explicit act, with the components visible and listable. Wardrobe, voice, biography, and props. Students can inventory them.\n\nWhat happened. The Theranos founder built a public persona deliberately: black turtlenecks modeled on Steve Jobs, a fixed unblinking gaze, and a low speaking voice that former colleagues have said was not her natural register. She was on magazine covers as the youngest self made woman billionaire before the company's technology was shown not to work. She was convicted of fraud in 2022.",
            "links": [
              {
                "id": "c3-oct19-s0-l0",
                "label": "Watch: The persona on camera",
                "url": "https://www.youtube.com/results?search_query=Elizabeth+Holmes+voice+turtleneck+interview+compilation"
              },
              {
                "id": "c3-oct19-s0-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Elizabeth+Holmes"
              }
            ]
          },
          {
            "id": "c3-oct19-s1",
            "text": "5.3 Richard Jewell (1996)",
            "bodyOverride": "The move. Tell them the hero version and stop. Then continue. Ask what evidence caused the turn.\n\nWhy. The clearest case on this list of a character built out of nothing but resemblance to a type. Reporters cast him because he fit a profile, and the correction never reached the audience the accusation did.\n\nWhat happened. A security guard found a backpack containing a bomb at the Atlanta Olympics, alerted police, and helped clear the area before it detonated. He was briefly a hero. Within days the Atlanta Journal-Constitution reported he was a suspect, and the coverage turned. He was described as a failed cop and a loner living with his mother. He was never charged, was formally cleared months later, and the actual bomber was identified years afterward. Jewell died at 44.",
            "links": [
              {
                "id": "c3-oct19-s1-l0",
                "label": "Watch: Contemporary coverage and the aftermath",
                "url": "https://www.youtube.com/results?search_query=Richard+Jewell+1996+Olympic+bombing+news+coverage+suspect"
              },
              {
                "id": "c3-oct19-s1-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Richard+Jewell"
              }
            ]
          },
          {
            "id": "c3-oct19-s2",
            "text": "5.6 Balloon Boy (2009)",
            "bodyOverride": "The move. Watch the interview. Ask what tells them the performance has stopped.\n\nWhy. A family performing characters live on national television, and the performance breaking on camera in real time. It is short, it is genuinely funny, and it gets at the difference between a person and a role.\n\nWhat happened. A Colorado family reported that their six year old son had floated away in a homemade helium balloon. Cable news covered the chase live for hours. The balloon landed empty. The boy was in the attic. During a CNN interview that evening the child said something on air that suggested it had been staged, and the parents later pleaded guilty.",
            "links": [
              {
                "id": "c3-oct19-s2-l0",
                "label": "Watch: The live coverage and the CNN interview",
                "url": "https://www.youtube.com/results?search_query=Balloon+Boy+2009+CNN+interview+we+did+this+for+the+show"
              },
              {
                "id": "c3-oct19-s2-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Balloon+boy+hoax"
              }
            ]
          }
        ]
      }
    }
  },
  "Oct 21": {
    "sequenceId": "__freeform",
    "title": "Who gets to decide who the hero and the villain are?",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-oct21-plan",
            "text": "How the day runs",
            "bodyOverride": "Bartman. Watch the crowd rather than the ball. Ask when he became a character and who decided. Gypsy Rose: ask them to assign a role and let the room fail to agree, then say the failure is the lesson. Lewinsky: a 1998 comedy clip, then the TED talk. Who had the power to cast her each time? Kaepernick last, two outlets from the same day, and the question stays on word choice and shot selection. If the room drifts to whether he was right, pull the question back.",
            "links": []
          }
        ]
      },
      "sec-stories": {
        "title": "Stories",
        "items": [
          {
            "id": "c3-oct21-s0",
            "text": "5.5 Steve Bartman (2003)",
            "bodyOverride": "The move. Watch the crowd, not the ball. Ask when he became a character and who decided.\n\nWhy. A crowd cast a villain in about four seconds, on live television, with no deliberation. It is the fastest character assignment available and the subject never got a line of dialogue.\n\nWhat happened. A Chicago Cubs fan reached for a foul ball down the left field line during a playoff game, possibly preventing his own team's outfielder from catching it. The Cubs collapsed that inning and lost the series. He was escorted out under security, his name and workplace circulated, and he received threats. He never spoke publicly. The Cubs gave him a World Series ring in 2016.",
            "links": [
              {
                "id": "c3-oct21-s0-l0",
                "label": "Watch: Catching Hell, the ESPN documentary",
                "url": "https://www.youtube.com/results?search_query=Catching+Hell+Steve+Bartman+ESPN+documentary+Alex+Gibney"
              },
              {
                "id": "c3-oct21-s0-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Steve+Bartman+incident"
              }
            ]
          },
          {
            "id": "c3-oct21-s1",
            "text": "5.2 Gypsy Rose Blanchard (2015 onward)",
            "bodyOverride": "The move. Ask them to assign her a role. Watch the room fail to agree, then name that failure as the lesson.\n\nWhy. She is a victim and a perpetrator at once, and no standard character slot holds her. Coverage has cast her as monster, martyr, and celebrity in sequence. It is also the case where the subject took narration back from the press, which is unusual.\n\nWhat happened. Gypsy Rose was raised by a mother who claimed she had leukemia, muscular dystrophy, and other conditions she did not have, kept her in a wheelchair, and subjected her to unnecessary medical procedures. In 2015 Gypsy Rose arranged with an online boyfriend for her mother to be killed. She served most of a decade, was released in December 2023, and immediately became a large social media presence telling her own story.\n\nViolence, abuse or death is the subject.",
            "links": [
              {
                "id": "c3-oct21-s1-l0",
                "label": "Watch: Documentary treatment",
                "url": "https://www.youtube.com/results?search_query=Mommy+Dead+and+Dearest+documentary+Gypsy+Rose+trailer"
              },
              {
                "id": "c3-oct21-s1-l1",
                "label": "Watch: Her own account after release",
                "url": "https://www.youtube.com/results?search_query=Gypsy+Rose+Blanchard+interview+after+prison+release+2024"
              },
              {
                "id": "c3-oct21-s1-l2",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Gypsy-Rose+Blanchard"
              }
            ]
          },
          {
            "id": "c3-oct21-s2",
            "text": "5.9 Monica Lewinsky, then and now (1998 onward)",
            "bodyOverride": "The move. Show a 1998 comedy clip, then the TED talk. Ask who had the power to cast her each time.\n\nWhy. You told me this story has to be in the class. Its best use is here. She was cast in 1998 and recast herself twenty years later, and the second casting was done by the subject. That almost never happens.\n\nWhat happened. A 22 year old White House intern's relationship with President Clinton became a national scandal and an impeachment. She was, at the time, treated as a punchline across late night television, tabloids, and mainstream news, and largely could not work for years. Beginning around 2014 she began writing and speaking publicly about public shaming, gave a widely watched TED talk, and became a producer on a television series about the scandal.\n\nViolence, abuse or death is the subject.",
            "links": [
              {
                "id": "c3-oct21-s2-l0",
                "label": "Watch: 1998 coverage and late night treatment",
                "url": "https://www.youtube.com/results?search_query=Monica+Lewinsky+1998+news+coverage+late+night+jokes"
              },
              {
                "id": "c3-oct21-s2-l1",
                "label": "Watch: Her TED talk",
                "url": "https://www.youtube.com/results?search_query=Monica+Lewinsky+TED+talk+price+of+shame"
              },
              {
                "id": "c3-oct21-s2-l2",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Clinton-Lewinsky+scandal"
              }
            ]
          },
          {
            "id": "c3-oct21-s3",
            "text": "5.10 Colin Kaepernick (2016 onward)",
            "bodyOverride": "The move. Compare two outlets' segments from the same day. Keep the question on word choice and shot selection, not on whether he was right.\n\nWhy. There is no consensus casting, and the disagreement is live in your room. Handled well, it is the strongest possible demonstration that character is assigned by the teller. Handled carelessly it becomes an argument about the underlying politics rather than about storytelling.\n\nWhat happened. A San Francisco 49ers quarterback sat, then knelt, during the national anthem to protest police violence against Black Americans. He has been covered since as a principled figure and as an unpatriotic one, sometimes in the same news cycle. He has not played in the NFL since 2016. Nike built a major campaign around him in 2018.\n\nPolitically live.",
            "links": [
              {
                "id": "c3-oct21-s3-l0",
                "label": "Watch: Coverage from multiple outlets",
                "url": "https://www.youtube.com/results?search_query=Colin+Kaepernick+kneeling+coverage+2016+different+networks"
              },
              {
                "id": "c3-oct21-s3-l1",
                "label": "Watch: The Nike campaign",
                "url": "https://www.youtube.com/results?search_query=Nike+Colin+Kaepernick+Dream+Crazy+ad+2018"
              },
              {
                "id": "c3-oct21-s3-l2",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Colin+Kaepernick"
              }
            ]
          }
        ]
      }
    }
  },
  "Oct 23": {
    "sequenceId": "__freeform",
    "title": "Workshop for the characters exercise.",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-oct23-plan",
            "text": "How the day runs",
            "bodyOverride": "Workshop for the exercise. Due Sunday. Also the last chance to sort audio pairs before Monday's no-class day, when they're supposed to be working on the treatment.",
            "links": []
          }
        ]
      }
    }
  },
  "Oct 26": {
    "sequenceId": "__freeform",
    "title": "No class. Students work on their audio story treatment.",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-oct26-plan",
            "text": "How the day runs",
            "bodyOverride": "No class. Treatments in progress. Pre-production is due Friday.",
            "links": []
          }
        ]
      }
    }
  },
  "Oct 28": {
    "sequenceId": "__freeform",
    "title": "How does the recording itself change what people hear, and what do we owe the people we record?",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-oct28-plan",
            "text": "How the day runs",
            "bodyOverride": "Zoom cat lawyer to open, then ask what their own failure will be on Sunday. Dean Scream, broadcast version first, get the reaction, then the room version. Say nothing in between. Astros: play a clip and have them count bangs, then show the pitch data. Serial, four minutes, list every sound source. Then the ethics half. Access Hollywood: when did the recording start and when did they think the recording stopped, then the same question about their own interviews. Found audio: describe the practice without playing any, and have them write the rule they'll follow in their own piece. That rule goes in their pre-production.",
            "links": []
          }
        ]
      },
      "sec-stories": {
        "title": "Stories",
        "items": [
          {
            "id": "c3-oct28-s0",
            "text": "6.8 The Zoom cat lawyer (2021)",
            "bodyOverride": "The move. Open the week with it. Then ask what their equivalent failure will be on Sunday.\n\nWhy. Low stakes and very funny, which makes it a good warm up before the heavy material in this week. It is also a real production failure with a real cause, and every student has had one.\n\nWhat happened. A Texas attorney appeared at a virtual court hearing with a kitten filter stuck on his face and told the judge he was not a cat. The clip circulated worldwide. The judge released it partly as a public reminder to check settings.",
            "links": [
              {
                "id": "c3-oct28-s0-l0",
                "label": "Watch: The clip",
                "url": "https://www.youtube.com/results?search_query=Zoom+cat+lawyer+I+am+not+a+cat+court+hearing"
              },
              {
                "id": "c3-oct28-s0-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=I%27m+not+a+cat"
              }
            ]
          },
          {
            "id": "c3-oct28-s1",
            "text": "6.1 The Dean Scream (2004)",
            "bodyOverride": "The move. Play broadcast first, get a reaction, then play the room version. Say nothing in between.\n\nWhy. The single best example in existence of audio quality creating meaning. No editing, no deception, one microphone choice. If your students take one thing from this week, make it this.\n\nWhat happened. After finishing third in the Iowa caucuses, Howard Dean gave a loud rallying speech to a packed, extremely noisy hall. He was on a unidirectional microphone designed to reject crowd noise. On broadcast, his shout came through isolated against near silence and sounded unhinged. It ran hundreds of times in a few days. Recordings made in the room, capturing the crowd, sound like an ordinary loud rally. His campaign collapsed.",
            "links": [
              {
                "id": "c3-oct28-s1-l0",
                "label": "Watch: The broadcast version",
                "url": "https://www.youtube.com/results?search_query=Howard+Dean+scream+2004+broadcast"
              },
              {
                "id": "c3-oct28-s1-l1",
                "label": "Watch: The room audio version",
                "url": "https://www.youtube.com/results?search_query=Howard+Dean+scream+crowd+microphone+room+audio+comparison"
              },
              {
                "id": "c3-oct28-s1-l2",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Howard+Dean+2004+presidential+campaign+scream"
              }
            ]
          },
          {
            "id": "c3-oct28-s2",
            "text": "6.2 The Astros trash can (2017 to 2020)",
            "bodyOverride": "The move. Play a clip and ask them to count bangs. Then show the pitch data.\n\nWhy. Audio as forensic evidence, recovered from recordings made for a completely different purpose. It shows students that a soundtrack contains more than what was intended to be in it.\n\nWhat happened. The Houston Astros used a center field camera to decode opposing catchers' signs and relayed pitch type to hitters by banging on a dugout trash can. It was proven largely from broadcast audio. Fans and analysts went back through game tapes, isolated the banging, and matched it to pitch data. Major League Baseball investigated and suspended executives.",
            "links": [
              {
                "id": "c3-oct28-s2-l0",
                "label": "Watch: Isolated bang audio matched to pitches",
                "url": "https://www.youtube.com/results?search_query=Astros+sign+stealing+trash+can+bangs+audio+evidence"
              },
              {
                "id": "c3-oct28-s2-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Houston+Astros+sign+stealing+scandal"
              }
            ]
          },
          {
            "id": "c3-oct28-s3",
            "text": "6.3 Serial, season one (2014)",
            "bodyOverride": "The move. Play four minutes and have them list every distinct sound source. There will be more than they expect.\n\nWhy. The show that set the sonic template for the decade of audio your students have grown up on. Also useful because its audio is deliberately imperfect: phone lines, room tone, and long pauses that a broadcaster would have cut.\n\nWhat happened. Sarah Koenig reinvestigated the 1999 murder of a Baltimore high school student and the conviction of her ex-boyfriend across twelve episodes. It was downloaded tens of millions of times and is widely credited with making podcasting a mainstream form. It leans heavily on phone recordings from prison, archival interviews, and the host's own thinking out loud.\n\nViolence, abuse or death is the subject.",
            "links": [
              {
                "id": "c3-oct28-s3-l0",
                "label": "Watch: Episode one",
                "url": "https://www.youtube.com/results?search_query=Serial+podcast+season+one+episode+one+Sarah+Koenig"
              },
              {
                "id": "c3-oct28-s3-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Serial+podcast"
              }
            ]
          },
          {
            "id": "c3-oct28-s4",
            "text": "6.11 The Access Hollywood tape (2005, released 2016)",
            "bodyOverride": "The move. Ask when the recording started and when the subjects thought it had stopped. Then ask about their own interviews.\n\nWhy. The hot mic problem in its most consequential form. Students need the technical lesson before they start recording people: a microphone does not know when the interview ended. It also raises the ethics of publishing audio made without the subject's awareness.\n\nWhat happened. A 2005 recording surfaced during the 2016 campaign in which Donald Trump, on a bus with a television host, described grabbing women. The audio was captured by a lapel microphone still live while the men believed themselves to be off camera. The Washington Post published it a month before the election. It dominated coverage for days.\n\nPolitically live. Violence, abuse or death is the subject.",
            "links": [
              {
                "id": "c3-oct28-s4-l0",
                "label": "Watch: Coverage of the release",
                "url": "https://www.youtube.com/results?search_query=Access+Hollywood+tape+2016+release+coverage"
              },
              {
                "id": "c3-oct28-s4-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Donald+Trump+Access+Hollywood+tape"
              }
            ]
          },
          {
            "id": "c3-oct28-s5",
            "text": "6.9 Found audio in true crime podcasts (ongoing)",
            "bodyOverride": "The move. Do not play any. Describe the practice and ask them to write the rule they will follow in their own piece.\n\nWhy. Not a single story but a pattern, and it is the ethics discussion your students most need before they go record people. Legal to use is not the same as right to use.\n\nWhat happened. A large share of true crime podcasts open with a 911 call or an interrogation recording. These are usually public records, so using them is legal. The choices about whether to play a victim's voice, how long to run it, and whether to warn the audience are entirely editorial, and practice varies widely across shows.\n\nViolence, abuse or death is the subject.",
            "links": [
              {
                "id": "c3-oct28-s5-l0",
                "label": "Watch: Criticism of the practice",
                "url": "https://www.youtube.com/results?search_query=true+crime+podcast+ethics+911+calls+victims+families+criticism"
              },
              {
                "id": "c3-oct28-s5-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=True+crime+podcast+ethics+criticism"
              }
            ]
          }
        ]
      }
    }
  },
  "Oct 30": {
    "sequenceId": "__freeform",
    "title": "Workshop for the audio story. Pre-production due.",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-oct30-plan",
            "text": "How the day runs",
            "bodyOverride": "Workshop. Pairs bring treatments and I approve or send back. Push on the interview list and whether the subjects know they're being recorded. Audio exercise due Sunday.",
            "links": []
          }
        ]
      }
    }
  },
  "Nov 2": {
    "sequenceId": "__freeform",
    "title": "How do you identify the audience for a story?",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-nov2-plan",
            "text": "How the day runs",
            "bodyOverride": "Bad Bunny: who did the NFL think the audience was, who was actually watching, and how would you find out. Duolingo, three videos, then three failed brand imitations. What did the imitations miss? Trump on Twitter for direct address: who was being addressed and who was only reading. AOC on Twitch for the other direction, going where the audience already is. Ask what she'd have lost by giving a speech on the stream. Audio stories are due Sunday; ask each pair who theirs is for, in one sentence.",
            "links": []
          }
        ]
      },
      "sec-stories": {
        "title": "Stories",
        "items": [
          {
            "id": "c3-nov2-s0",
            "text": "7.8 The Bad Bunny halftime show (February 2026)",
            "bodyOverride": "The move. Ask who the NFL thought the audience was. Then ask who it actually is, and how you would find out.\n\nWhy. The most recent case, and the argument was explicitly about audience: who is the default viewer of a national broadcast. Your students watched it and have positions.\n\nWhat happened. Bad Bunny headlined the Super Bowl halftime show, performing largely in Spanish. The booking drew both celebration and objection in the months beforehand, much of it about language and about who the largest broadcast of the American year is addressed to. Viewership was enormous.\n\nPolitically live.",
            "links": [
              {
                "id": "c3-nov2-s0-l0",
                "label": "Watch: Coverage and reaction",
                "url": "https://www.youtube.com/results?search_query=Bad+Bunny+Super+Bowl+halftime+2026+reaction+coverage"
              },
              {
                "id": "c3-nov2-s0-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Super+Bowl+LX+halftime+show"
              }
            ]
          },
          {
            "id": "c3-nov2-s1",
            "text": "7.9 Duolingo on TikTok (2021 onward)",
            "bodyOverride": "The move. Watch three Duolingo videos and three failed brand imitations. Ask what the imitations did not understand.\n\nWhy. A case where a company learned a platform's grammar instead of importing its own, and a long list of failed imitators as the control group. Directly useful for your students choosing where their work should live.\n\nWhat happened. A language learning app put an intern in charge of its TikTok account and let the owl mascot behave like a chaotic character rather than a brand. It gained tens of millions of followers. The company later staged the mascot's death as a campaign. Most corporate accounts that copied the approach failed, because they imported a brand voice onto a platform with different rules.",
            "links": [
              {
                "id": "c3-nov2-s1-l0",
                "label": "Watch: How the account works",
                "url": "https://www.youtube.com/results?search_query=Duolingo+TikTok+strategy+explained+social+media+manager"
              },
              {
                "id": "c3-nov2-s1-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Duolingo+social+media"
              }
            ]
          },
          {
            "id": "c3-nov2-s2",
            "text": "7.11 Trump and Twitter (2015 to 2021)",
            "bodyOverride": "The move. Ask who the audience was and who the audience was not. The press was reading, but it was not being addressed.\n\nWhy. The clearest case of direct address at scale, and of a press corps losing control of what counted as an event. Whatever a student thinks of him, the mechanic is the lesson, and it is the mechanic every campaign since has tried to reproduce.\n\nWhat happened. Donald Trump used the platform to address supporters directly, without a press office between him and them, at a volume that made the posts themselves the news. Newsrooms built desks around covering them. He was suspended after January 6, later returned to the platform under new ownership, and has since operated his own.\n\nPolitically live.",
            "links": [
              {
                "id": "c3-nov2-s2-l0",
                "label": "Watch: How newsrooms adapted",
                "url": "https://www.youtube.com/results?search_query=Trump+Twitter+how+news+covered+his+tweets+media+strategy"
              },
              {
                "id": "c3-nov2-s2-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Social+media+use+by+Donald+Trump"
              }
            ]
          },
          {
            "id": "c3-nov2-s3",
            "text": "7.13 AOC on Twitch (2020)",
            "bodyOverride": "The move. Ask what she would have lost by giving a speech on the stream instead of playing.\n\nWhy. Going to an audience where it already is, on that platform's terms, rather than summoning it to a rally. It is the structural counterweight to the two entries above, and it makes the address question concrete: she was not addressing the press at all.\n\nWhat happened. Alexandria Ocasio-Cortez streamed the game Among Us on Twitch with popular streamers days before the election, encouraging voter registration. It drew several hundred thousand concurrent viewers, among the largest streams on the platform at the time. She played the game rather than delivering a speech during it.\n\nPolitically live.",
            "links": [
              {
                "id": "c3-nov2-s3-l0",
                "label": "Watch: The stream and coverage of it",
                "url": "https://www.youtube.com/results?search_query=AOC+Among+Us+Twitch+stream+2020+voter+registration"
              },
              {
                "id": "c3-nov2-s3-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Alexandria+Ocasio-Cortez+Twitch+Among+Us+stream"
              }
            ]
          }
        ]
      }
    }
  },
  "Nov 4": {
    "sequenceId": "__freeform",
    "title": "How does the platform change the story, and what happens when the wrong audience finds it?",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-nov4-plan",
            "text": "How the day runs",
            "bodyOverride": "Nixon and Kennedy. Tell the famous version, let them accept the story, then show the evidence. Mamdani, three campaign videos with the sound off: who is each one for? MrBeast, the same clip in two languages: one video or two? Bud Light to close: who the post was addressed to, then who saw the post. Keep the discussion on the mechanism. The structural point for their own work: anything sent to one audience is visible to every other audience now.",
            "links": []
          }
        ]
      },
      "sec-stories": {
        "title": "Stories",
        "items": [
          {
            "id": "c3-nov4-s0",
            "text": "7.12 Nixon and Kennedy, radio and television (1960)",
            "bodyOverride": "The move. Tell them the famous version. Let them accept it. Then show them the evidence for it.\n\nWhy. Two lessons at once. The real one about channel and preparation, and a second one about a media studies myth that gets repeated in textbooks. Teaching students to check the story about the story is worth a day.\n\nWhat happened. The first televised presidential debate. The familiar claim is that radio listeners thought Nixon won while television viewers thought Kennedy did. That claim traces to a small and methodologically weak survey, and historians have challenged it for decades. What is not disputed is that Kennedy prepared for the camera and Nixon, recently ill and refusing makeup, did not.\n\nPolitically live.",
            "links": [
              {
                "id": "c3-nov4-s0-l0",
                "label": "Watch: The debate",
                "url": "https://www.youtube.com/results?search_query=Kennedy+Nixon+1960+first+televised+debate"
              },
              {
                "id": "c3-nov4-s0-l1",
                "label": "Read: The disputed radio claim",
                "url": "https://en.wikipedia.org/w/index.php?search=Kennedy+Nixon+debate+radio+listeners+myth"
              }
            ]
          },
          {
            "id": "c3-nov4-s1",
            "text": "7.7 Zohran Mamdani's mayoral campaign (2025)",
            "bodyOverride": "The move. Watch three campaign videos with the sound off. Ask who each one is for.\n\nWhy. The most current example of platform strategy determining an outcome. Keep the classroom question on craft, since the politics will pull the room otherwise.\n\nWhat happened. A New York state assembly member ran for mayor with a campaign built substantially around short vertical video, much of it made in-house, in multiple languages, addressing specific neighborhoods and specific policy questions. He won the Democratic primary and then the general election. Analysts across the spectrum described the video operation as central rather than supplementary.\n\nPolitically live.",
            "links": [
              {
                "id": "c3-nov4-s1-l0",
                "label": "Watch: Analysis of the video strategy",
                "url": "https://www.youtube.com/results?search_query=Mamdani+campaign+vertical+video+social+media+strategy+analysis"
              },
              {
                "id": "c3-nov4-s1-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Zohran+Mamdani"
              }
            ]
          },
          {
            "id": "c3-nov4-s2",
            "text": "7.15 MrBeast's dubbing operation (2021 onward)",
            "bodyOverride": "The move. Play the same clip in two languages. Ask whether it is one video or two.\n\nWhy. Address treated as an operational department with staff and a budget, not as an afterthought. It also forces the question of whether translation is distribution or whether it makes a different piece of work.\n\nWhat happened. Rather than relying on subtitles, MrBeast built separate channels in Spanish, Hindi, Portuguese, and other languages, initially with hired voice actors matching the original delivery, and later using other methods. Several of those channels have audiences larger than most native creators in those markets.",
            "links": [
              {
                "id": "c3-nov4-s2-l0",
                "label": "Watch: How the localization works",
                "url": "https://www.youtube.com/results?search_query=MrBeast+dubbing+channels+localization+strategy+explained"
              },
              {
                "id": "c3-nov4-s2-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=MrBeast+YouTube+channels+localization"
              }
            ]
          },
          {
            "id": "c3-nov4-s3",
            "text": "7.19 Bud Light (2023)",
            "bodyOverride": "The move. Ask who the post was addressed to, then who saw it. Keep the discussion on the mechanism.\n\nWhy. The clearest recent case of a brand discovering it had two audiences that could not both be addressed, and that a message sent to one is now always visible to the other. That last part is the structural lesson and it applies to everything your students will make.\n\nWhat happened. A single sponsored post by transgender influencer Dylan Mulvaney, sent to her own audience, produced a boycott among a different part of the brand's customer base. Sales fell sharply and the brand lost its position as the top selling beer in the United States. The company's response satisfied neither audience, and executives were placed on leave.\n\nPolitically live.",
            "links": [
              {
                "id": "c3-nov4-s3-l0",
                "label": "Watch: What happened and the response",
                "url": "https://www.youtube.com/results?search_query=Bud+Light+Dylan+Mulvaney+2023+boycott+sales+response"
              },
              {
                "id": "c3-nov4-s3-l1",
                "label": "Read: Background",
                "url": "https://en.wikipedia.org/w/index.php?search=Bud+Light+Dylan+Mulvaney+boycott"
              }
            ]
          }
        ]
      }
    }
  },
  "Nov 6": {
    "sequenceId": "__freeform",
    "title": "Workshop for the audio story.",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-nov6-plan",
            "text": "How the day runs",
            "bodyOverride": "Workshop. Listen to drafts with headphones. The two things to check: can I hear the room, and did the subject know. Due Sunday night.",
            "links": []
          }
        ]
      }
    }
  },
  "Nov 9": {
    "sequenceId": "__freeform",
    "title": "What is the final project, and what does it ask of you?",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-nov9-plan",
            "text": "How the day runs",
            "bodyOverride": "The final, start to finish: groups of four, video plus audio plus multimedia, 35 percent, due December 9. Presentations December 2, with pre-production due that night. Walk the calendar backwards from December 9 so they see how little production time there is. Spec is still open: lengths, and whether groups self-select. Settle both before today.",
            "links": []
          }
        ]
      }
    }
  },
  "Nov 11": {
    "sequenceId": "__freeform",
    "title": "What stories are worth the final? Groups form.",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-nov11-plan",
            "text": "How the day runs",
            "bodyOverride": "Confirm SCU meets on Veterans Day before this. Story options first: what's worth four weeks of four people, and what social justice angle carries research. Then groups form. Every group leaves with a name and a topic to pitch Monday.",
            "links": []
          }
        ]
      }
    }
  },
  "Nov 13": {
    "sequenceId": "__freeform",
    "title": "How do you shoot video that tells a story?",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-nov13-plan",
            "text": "How the day runs",
            "bodyOverride": "Shooting day. Everything from week 2 applied with motion: angle, distance, when to move the camera and when to hold. Phones are fine. Have them shoot a 30-second scene in the building and bring the clips back for a look. No story bank for this one; use their footage.",
            "links": []
          }
        ]
      }
    }
  },
  "Nov 16": {
    "sequenceId": "__freeform",
    "title": "Groups pitch their story and get it approved or sent back.",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-nov16-plan",
            "text": "How the day runs",
            "bodyOverride": "Pitches. Each group gets five minutes and a decision: approved, or sent back with what's missing. Sent-back groups re-pitch in office hours Thursday. After today there's no class until November 30, so say plainly what should exist by then: footage shot, interviews recorded.",
            "links": []
          }
        ]
      }
    }
  },
  "Nov 18": {
    "sequenceId": "__freeform",
    "title": "No class. Groups work on the final.",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-nov18-plan",
            "text": "How the day runs",
            "bodyOverride": "No class. Production.",
            "links": []
          }
        ]
      }
    }
  },
  "Nov 20": {
    "sequenceId": "__freeform",
    "title": "No class. Groups work on the final.",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-nov20-plan",
            "text": "How the day runs",
            "bodyOverride": "No class. Production. Thanksgiving week is off too.",
            "links": []
          }
        ]
      }
    }
  },
  "Nov 30": {
    "sequenceId": "__freeform",
    "title": "How do you edit video so the story comes through?",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-nov30-plan",
            "text": "How the day runs",
            "bodyOverride": "Editing day. Bring back Rodney King and Covington: a cut is an argument, and where you start and stop is the frame. Then the practical half, in whatever tool they're using: order, length, sound under picture, when to cut away. Presentations are Wednesday, and pre-production is due that night.",
            "links": []
          }
        ]
      }
    }
  },
  "Dec 2": {
    "sequenceId": "__freeform",
    "title": "Groups present their story to the class. Pre-production due tonight.",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-dec2-plan",
            "text": "How the day runs",
            "bodyOverride": "Presentations. Each group shows where the story stands and gets questions from the room. Pre-production is due tonight: treatment, sources, shot list, who's doing what.",
            "links": []
          }
        ]
      }
    }
  },
  "Dec 4": {
    "sequenceId": "__freeform",
    "title": "Workshop for the final.",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-dec4-plan",
            "text": "How the day runs",
            "bodyOverride": "Last workshop. Groups edit in the room and come up with problems. Final due Wednesday, December 9.",
            "links": []
          }
        ]
      }
    }
  },
  "Dec 9": {
    "sequenceId": "__freeform",
    "title": "Final project due.",
    "notes": "",
    "slides": "",
    "blocks": [],
    "slots": {
      "sec-plan": {
        "title": "Lesson plan",
        "items": [
          {
            "id": "c3-dec9-plan",
            "text": "How the day runs",
            "bodyOverride": "Final due. No class meeting.",
            "links": []
          }
        ]
      }
    }
  }
};
