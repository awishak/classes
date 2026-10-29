-- The audio exercise's 60-second story: audio files into the visual-story bucket.
--
-- Run once in the Supabase SQL editor for the classes project. Safe to run
-- again. Andrew, 2026-10-29: "have students submit a 60 second audio story
-- to go with their idea ... has to be in certain formats." The sheet
-- (src/engine/audiostory/audio.js) takes m4a, mp3, wav and aac and refuses
-- anything over 60 seconds before the upload starts. The bucket's rules
-- already keep a student to their own folder and let the instructor see
-- every folder (sql/visual-story-portal.sql); this only lets audio types in.
-- Before this runs the bucket refuses an audio upload (415) and the sheet
-- tells the student audio is not switched on yet.

update storage.buckets
   set allowed_mime_types = array[
         'image/jpeg', 'image/png', 'image/webp', 'text/html',
         'audio/x-m4a', 'audio/mp4', 'audio/m4a', 'audio/aac', 'audio/x-aac',
         'audio/mpeg', 'audio/mp3',
         'audio/wav', 'audio/x-wav', 'audio/wave'
       ]
 where id = 'visual-story';
