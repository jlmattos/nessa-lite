# GAME-DESIGN.md — Pirouette's Stage

## 1. Pitch

**For Nessa (Jose can read this aloud):**

When you finish your workout, Pirouette's stage opens. You pick her costume, her stage and her music. You pick a dance, or make your own out of ballet moves. Then she dances it for you, with sparkles. Every workout is one rehearsal. After four rehearsals comes a recital: Pirouette dances all of that Program's dances while your cat friends watch from the front row, and the stage gets something new that stays forever. The more workouts you do, the more Pirouette has to wear, the more moves she knows, and the grander her stage becomes.

**For the developer:** one fixed post-workout session (Get ready · Choose a dance · Dance · Bow) drawn with the same schedule strip as Today. The three requested game shapes live inside it: Get ready is the dress rehearsal, Choose a dance holds the choreographer, and the rhythm game is an ignorable sparkle layer on top of the dance that is off until Jose turns it on. Every reward is derived from the completed-workout count or from rows she created, exactly like the cat shelf. Rest days change nothing. Nothing is ever taken away, and no number she has read ever changes.

## 2. Principles

1. **One session, same shape every day.** The stage is a four-step strip in the same visual grammar as Today, in the same order, with the same "Now … then …" line. There is no menu of games. On a recital day the four steps are the same; only what plays inside Dance changes.
2. **Four taps is a complete evening.** Every step has the last choice preselected and one full-width bottom button. Next · Next · Start the dance · Done for today.
3. **The workout stays plain; the stage is the reward.** No sparkle, music or counts during the workout. Contrast makes the stage feel special.
4. **One new thing per workout at most, announced before it appears.** Wardrobe and feature unlocks never land on a cat day or a recital day. The only double days are the cat-and-recital days (5, 20, 25, 35, 50), where the cat appears on the Friends tab and the decoration at the Bow, each announced in its own place. Locked items are visible in their fixed slot; the workout number under a locked item appears only once that item's code has shipped, and a number that has been shown never changes. A "Next: …" line always says what is coming and is never empty.
5. **Nothing can be wrong.** Every tap during the dance does something; a miss does nothing. A one-move dance is valid. Undo is one tap. No scores, streaks, timers, or "try again" anywhere. Rest days are invisible. Unearned rosettes are never shown.
6. **Clear beginning and ending.** "Start the dance" opens the curtains. The Bow closes them and says "The end." "Done for today" is persisted, visible from both tabs, and reversible.
7. **Sparkle and sound are capped, slow, consonant, tap-started, and switchable.** There is one moving-element budget per screen (§7). Calm mode turns every animation into a static pose.
8. **Everything derives from workout history.** The only stored things are what she makes (dances), what she chooses (today's look and dance, snapshotted so history never changes), and settings.
9. **Literal copy, fixed strings, one name per thing.** Steps are named for what she does there: "Get ready", "Choose a dance", "Dance", "Bow". The tab is "Stage" and the button that leads to it says "Go to the stage". Every catalog item has a name used for nothing else, and every announcement carries the kind word: "New today: Swan costume", "Next: Choose a dance", "Start the dance", "The end.", "Done for today", "at 13", "Tap when the sparkle reaches Pirouette's hand. You can also just watch."

## 3. A session, start to finish

Throughout, N = number of completed workouts (see §8 for `stage_start_on` and the high-water mark N_max used for unlocks). For anything shown on Today before Finish, `todayN = N + (todayComplete ? 0 : 1)`, so the morning describes today's upcoming workout and nothing displayed changes at Finish. Program = `ceil(todayN/5)`. Position in Program = `((todayN-1) % 5) + 1`: positions 1–4 are rehearsals, position 5 is recital day.

### 3.0 Opening the app (rest state)

**Today tab** (unchanged layout): the routine the rotation suggests, Start button (h-16), and the visual schedule strip: one icon per movement, then the ballet-slipper icon (Dance) as the last step. Current step ringed in coral. Line: "Now: Arm circles · then: Wall sit." The slipper has three states: outline (not yet), ringed coral (the stage is open and she has not danced yet today), dotted (today's `rehearsals` row has `danced_at`). There is no second star on the strip; the star lives only in the Program line and means only "recital".

Under the strip, the **Program line** (new, static, two short rows):

- Row 1: four 10 px circles and a 12 px star. Filled coral = rehearsal done this Program; coral outline = today's position; the star = recital day. Today's circle (or the star) fills at Finish; that is the only per-day completion mark. Text beside them, in this priority: if today is position 5 and Recital P has not been performed, "Recital 1 today."; else if an older recital is ready (§4), "Recital 1 is ready." with that Program's four circles filled and the star ringed; else "Rehearsal 3 of 4".
- Row 2: "Next: Swan costume in 2 workouts" (the next **shipped** catalog item, `k = unlockAt − todayN`; "in 1 workout" means the workout after today). When `k = 0` it reads "Today: Swan costume". When no shipped item lies ahead (between 50 and Season Two, after 100, or whenever a phase is late) it reads "Next: Recital 11 in 3 workouts", which is always true because recitals are every 5 forever. Before the first workout: "Next: the stage opens in 1 workout."

**Stage tab** (route stays `/dance`; the bottom-nav label is "Stage"): closed curtains, Pirouette resting (closed-arc eyes, `lite-sway` only), "Finish today's workout. Then Pirouette dances." and the same Program line. Nothing moves otherwise, nothing sounds.

### 3.1 Start

Tap Start. This gesture creates or resumes the shared AudioContext and plays one soft note (C5 sine, 0.6 s decay). The first card expands; the others stay compact. Strip highlights step 1.

### 3.2 Steps

Each Done tap: the existing two-note chime, the card checks and collapses (`lite-pop`, 250 ms), the strip icon gets a static gold dot, and the "Now … then …" line advances. Undo is one tap on the card. No confetti, no timers, no counts.

### 3.3 Last step

When the final movement is current: "Now: Wall sit · then: Dance". Same words every day.

### 3.4 Finish

Finish (h-16) → one confirmation sheet "Finish today's workout?" [Finish] [Not yet]. On Finish: the existing rising chord; today's circle in the Program line fills (`lite-pop`); the slipper becomes the current step, ringed coral, because dancing is literally what is next. Today then shows the **ending card**: Pirouette (static, in her last chosen look), "Workout done.", one optional line "New today: Swan costume" (only if N is the unlock day of a shipped item; on a move day it reads "New today: Sauté. Pirouette's choice has Sauté now." and Pirouette performs the new move once when the card appears, holding its pose in calm mode; on a length day it reads "New today: longer dances, 8 moves"), and one button "Go to the stage". Nothing navigates by itself. The Stage tab icon in the bottom nav gets a 6 px gold dot while today's workout is complete and no `rehearsals` row for today has `danced_at`; once she has started a dance the dot is gone for the day and nothing brings it back.

### 3.5 The stage opens (/dance)

The current step on opening is derived, never remembered in the browser: `workouts.stage_closed_at` set → the closed screen (§3.10); otherwise **Get ready**, with today's row (if any) preselected. If the row already has `danced_at`, the Dance and Bow steps show their dots so she can see she has danced; tapping through plays again.

The **dance strip** is rendered by the same `ScheduleStrip` component as Today: **Get ready** (dress icon) · **Choose a dance** (music-score icon) · **Dance** (ballet slipper) · **Bow** (clapping hands). Current step ringed in coral, done steps dotted, line "Now: Get ready · then: Choose a dance". The strip is identical on recital days.

### 3.6 Get ready

Pirouette at 220 px in her last chosen costume on her last chosen stage, the music name under her. A tap on Pirouette (pointer up with less than 8 px of movement and no scroll begun) does one Twirl with a chime: the zero-decision action, available on every idle Pirouette while the stage is open.

Above the choice cards, one quiet **banner slot**, present only when it has something to say, up to two lines in fixed order: "New today: Swan costume" (the same sentence as the ending card) and "New since last time: Harp Song music · Swan costume" (shipped wardrobe, move and length items that unlocked on workouts whose stage she never opened; decorations and preferences are never listed, see §8). No tap is required to dismiss it; it retires when today's row exists (§5.1).

Under her, a 2×2 grid of **choice cards**: Costume · Stage · Music · Sparkle style. Each card shows the current pick as one 72 px tile and its name. Tapping a card opens that **one row as its own screen**: 72 px tiles in fixed catalog order wrapped four per line so every tile is always on screen (no horizontal scrolling anywhere in the flow), chosen tile ringed coral, locked tiles dimmed with "at 13" under them once that item's code has shipped and with no number before, today's new tile with a breathing gold outline (static outline in calm mode). Season Two tiles are hidden until N_max ≥ 50. The Music row begins with a permanent **Quiet** tile (no loop; the beat clock runs at 66 bpm) and the Sparkle style row with a permanent **None** tile. Tapping a tile applies it with a 300 ms crossfade and an 80 ms triangle tick; a music tile also plays a 2 s preview (300 ms ramps). "Back to Get ready" (h-16) returns. Nothing is required: the bottom button "Next: Choose a dance" is always enabled and the defaults are yesterday's choices.

### 3.7 Choose a dance

Pirouette small (120 px) at the top left; at the right, the **move strip** of this dance's moves drawn exactly like the schedule strip (6 slots at first, later 8/10/12). Below, a fixed 2×2 grid of tiles that never reorders: **Pirouette's choice** (star), **Little Waltz** (star), **Twirl Song** (star), **New dance** (dimmed until the editor unlocks; "at 7" appears only once the editor has shipped). Under the grid, "My dances": her saved dances newest first (empty until she saves one). The last-danced dance is preselected. Default path: "Next: Dance".

Tapping "New dance" or a saved dance's "Change" button opens the editor (§5.2). On an on-time recital day (position 5) this screen instead shows "Today's dances": the Program's 1–4 dances as read-only tiles, and the button still reads "Next: Dance". On a day when an older recital is ready (§4), the screen is the normal Choose a dance with one line above the grid: "Recital 1 is ready. It plays first."

### 3.8 Dance

The stage fills the width (4:3) with every decoration earned so far; the move strip for this dance sits under it. When the Sparkle catch lane is on (§5.3) one fixed line sits above the button: "Tap when the sparkle reaches Pirouette's hand. You can also just watch." One button: "Start the dance" (on recital day: "Start the recital"). On tap: `startDance(danceId)` writes the row (§8); curtains part over 2.5 s (tap anywhere skips); music fades in over 1.5 s; Pirouette performs each move for its beats at the loop's tempo, the current move ringed in the strip exactly like "Now" on Today. Ambient sparkles breathe around her within the screen's motion budget. If Sparkle catch is on, its layer runs on top (§5.3). A "Stop" button (h-14, top right) fades the music over 1 s and goes to Bow. If the page is hidden mid-dance (`visibilitychange`), the sequencer stops and the flow goes to Bow, so she never returns to a half-finished dance.

### 3.9 Bow

Pirouette bows (`lite-bow`, 1.6 s). The earned cat friends in the front-row box do one small clap (`lite-flex`). A final slow chord (1.8 s decay). Curtains close over 3 s, with any bow shower earned (petals, confetti, fireworks; `bow_showers` on) capped at 20 particles, no more than one new particle per 150 ms. `recordCatches(n)` runs once here, including after Stop.

Card: "The end." then "Rehearsal 3 of 4." On recital day: "Recital 2 complete." with the poster and "New on the stage: string lights" (one line, naming every decoration that became visible with this recital). Plus any rosette line earned today ("You made a dance."). Two buttons: **Done for today** (primary) and **Dance again** (secondary; replays exactly what just played, recital included, nothing more is written except catches).

### 3.10 Done for today (the persisted ending)

"Done for today" writes `workouts.stage_closed_at = now()`. The curtains close and the Stage tab reads "The stage is closed for today." with one small button "Open the curtains" (clears `stage_closed_at`; the stage reopens at Get ready for free play, the nav dot does not return, and nothing more is earned). Today now shows the done state: every strip icon dotted, slipper dotted, today's circle filled, Pirouette in today's costume, "Today is done." and the Program line. Reopening the workout (clearing `completed_at`) also clears `stage_closed_at`.

### 3.11 Next day

Everything is in the same place. A day she does not open the app is a rest day; no message about it anywhere.

## 4. The long-term arc

- **One finished workout = one rehearsal.** Five consecutive completed workouts, by count, not calendar, = one **Program**. Positions 1–4 are rehearsals; position 5 is **recital day**.
- **Recitals stay ready until performed, and only the newest is performed.** Recital P becomes ready at N ≥ 5P and remains ready until a `rehearsals` row has `recital_program = P` and `danced_at` set. If she finished workout 5 but never opened the stage, workout 6's stage visit plays Recital 1 first and then her chosen dance (strip unchanged; Today says "Recital 1 is ready"). If more than one recital is ready, only the newest is performed; the older ones are skipped, their posters still derive from their rehearsal rows, and their decorations arrive together with the newest recital's.
- **Ten Programs = Season One** (50 workouts, the same cap as the cat shelf). Season Two runs 51–100 with content only; the daily flow never changes.
- **"The game gets better" means six visible, permanent things:**
  1. **The stage accumulates decorations after every performed recital**, present every day afterwards on every stage, no choice needed. Decorations derive from the highest performed `recital_program`, so the Bow card is their one announcement.
  2. **The wardrobe fills in**: 8 costumes, 7 stages, 6 music loops (plus Quiet), 5 sparkle styles (plus None) by 50.
  3. **The choreographer grows**: 4 → 8 moves, 6 → 12 moves per dance.
  4. **The sparkle grows**: ambient sparkles = 6 + Programs completed (`floor(N/5)`, cap 12) in "lots"; Sparkle catch can be turned on from 11 and gains a second lane from 34 (both Jose's call, §5.3).
  5. **Recitals grow by themselves**: they replay her own dances, in more costumes, on bigger stages, with more cats in the audience (cats unlock at 1, 3, 5, 8, 12, 16, 20, 25, 35, 50).
  6. **A Programs shelf** on the Friends tab: one poster per Program, next to the cats, so months of work are visible in one place.
- **Program themes** name the posters and group the content so each Program feels like one chapter. The theme word appears only on the poster and the Programs shelf, never in a Bow card or an announcement, so it cannot be confused with a wardrobe item:

| Program | Workouts | Theme | Recital adds |
|---|---|---|---|
| 1 | 1–5 | First Steps | footlights |
| 2 | 6–10 | Moonlight | string lights |
| 3 | 11–15 | Sugar Plum | flower garlands on the curtains |
| 4 | 16–20 | Garden | second spotlight |
| 5 | 21–25 | Snow | rose petals at the bow |
| 6 | 26–30 | Rain | chandelier |
| 7 | 31–35 | Ocean | orchestra pit with five floating notes |
| 8 | 36–40 | Starlight | gold proscenium |
| 9 | 41–45 | Grand Theater | confetti at the bow |
| 10 | 46–50 | Rainbow | fireworks finale + Season One poster |

### 4.1 Season One unlock table (N = completed workouts)

Cat days (1, 3, 5, 8, 12, 16, 20, 25, 35, 50) carry no wardrobe or feature unlock: the cat is the new thing. Recital days (multiples of 5) bring their decoration only, at the Bow. Workouts with nothing new of their own: 29, 48, 49, and from her point of view 11 and 34 (preferences Jose turns on). Every other workout brings one item. Every catalog item has a unique name across all kinds, and every announcement carries the kind word.

| N | Unlock | Kind |
|---|---|---|
| 1 | Stage opens. Costume Classic, stage Practice Room, music Music Box (plus the permanent Quiet tile), sparkle style Gold (plus the permanent None tile), moves Plié · Reach · Twirl · Arabesque, 6 moves per dance, presets Pirouette's choice · Little Waltz · Twirl Song | base |
| 2 | Harp Song | music |
| 4 | Swan | costume |
| 5 | Recital 1 → footlights | decoration |
| 6 | Moon Night | stage |
| 7 | New dance (the editor) | feature |
| 9 | Sauté | move |
| 10 | Recital 2 → string lights | decoration |
| 11 | Sparkle catch becomes available to turn on (Jose; not announced to her) | preference |
| 13 | Sugar Plum | costume |
| 14 | Longer dances: 8 moves | length |
| 15 | Recital 3 → flower garlands | decoration |
| 17 | Garden Hills | stage |
| 18 | Rose Garden | costume |
| 19 | Pink Hearts | sparkle style |
| 20 | Recital 4 → second spotlight | decoration |
| 21 | Silver Bells | music |
| 22 | Snow Field | stage |
| 23 | Snowflake | costume |
| 24 | Snowfall | sparkle style |
| 25 | Recital 5 → rose petals at the bow | decoration |
| 26 | Rain Piano | music |
| 27 | Curtsy | move |
| 28 | Longer dances: 10 moves | length |
| 30 | Recital 6 → chandelier | decoration |
| 31 | Ocean Waves | music |
| 32 | Seashore | stage |
| 33 | Glide | move |
| 34 | Sparkle catch second lane becomes available (Jose; not announced to her) | preference |
| 35 | Recital 7 → orchestra pit | decoration |
| 36 | Twinkles | sparkle style |
| 37 | Starlight | costume |
| 38 | Starry Sky | stage |
| 39 | Ballroom Waltz | music |
| 40 | Recital 8 → gold proscenium | decoration |
| 41 | Big spin | move |
| 42 | Longer dances: 12 moves | length |
| 43 | Firebird | costume |
| 44 | Grand Theater | stage |
| 45 | Recital 9 → confetti at the bow | decoration |
| 46 | Colour Drops | sparkle style |
| 47 | Rainbow | costume |
| 50 | Recital 10 → fireworks, Season One poster | decoration |

Totals at 50: 8 costumes, 7 stages, 6 music loops, 5 sparkle styles, 8 moves, 12 moves per dance, 10 decorations, 10 posters. Longest gap between unlocks: 3 workouts (47 → 50); the "Next: …" line falls back to the next recital whenever no shipped item is ahead, so it is never empty.

### 4.2 Season Two (51–100), content only

Same flow, same strip, recitals every 5. Every item is a palette swap, a gradient swap, or a data pattern, each 10–40 minutes of work. Season Two tiles are hidden until N_max ≥ 50 (a `season` field on catalog items), then appear in fixed order after the Season One tiles.

| N | Unlock |
|---|---|
| 52, 58, 63, 68, 73, 78, 83, 88 | Encore colourways (CSS-variable recolours): Rose Classic, Midnight Swan, Mint Sugar Plum, Sunset Rose Garden, Ice Snowflake, Silver Starlight, Ember Firebird, Pastel Rainbow |
| 54, 62, 67, 72, 77, 82, 87 | Stage variants (gradient + sky swap): Practice Room at night, Moon Night at dawn, Garden Hills at evening, Snow Field at night, Seashore at sunset, Starry Sky with aurora, Grand Theater matinee |
| 56, 76 | Music: Lullaby Waltz (3/4, 60 bpm), Skipping Song (4/4, 84 bpm) |
| 59, 79 | Sparkle styles: Blossoms (coral), Fireflies (gold, slow) |
| 64, 84 | Moves: Wave Arms (2 beats), Final Pose (4 beats, held, sparkle rain) |
| 55, 60, 65, 70, 75, 80, 85, 90, 95 | Recitals 11–19: each turns one existing decoration gold (footlights, string lights, garlands), adds a third spotlight (70), gold petals (75), crystal chandelier (80), strings in the pit (85), velvet proscenium (90), gold confetti (95) |
| 97 | **Crown** costume (reuses the cat crown overlay) |
| 100 | Recital 20: grand fireworks, Season Two poster |

After 100: recitals, posters and the Programs shelf continue forever with no new assets, and the "Next:" line keeps naming the next recital. Season Three is whatever Jose adds to the catalog.

## 5. The three mini-games (and the recital that ties them together)

### 5.1 Get ready (dress rehearsal) — from workout 1

**How it works.** Step 1 of the strip (§3.6). Choice cards open one row per screen. Choices are upserted onto today's `rehearsals` row as she taps through `setLook(partial)`, which writes only the four look columns and never `dance_id`, `danced_at` or `recital_program`, so a recital can never count as performed before it is danced. The first tap on "Next: Choose a dance" calls `setLook({})` so the row exists even when she changed nothing; the row's existence is what retires the "New since last time" banner. Choices persist even if she stops before dancing, and they are the defaults tomorrow.

**Costumes** are overlay shapes over the shared Pirouette base plus CSS-variable colour overrides (`--tutu`, `--leotard`, `--bow`), exactly like the cat outfits:

| Costume | N | Tutu / leotard | Overlay |
|---|---|---|---|
| Classic | 1 | #f7c6d9 / #ec9fbd | none (existing) |
| Swan | 4 | white #fff7ef / white | three feather ellipses behind the bun |
| Sugar Plum | 13 | lilac #d8c3f0 / lilac | gold #e6b422 tiara path |
| Rose Garden | 18 | pink / leafy green #7fb069 | flower crown: three circles r=3 (coral, gold, pink) on the bun |
| Snowflake | 23 | pale blue #dbeefb / white | one silver 6-spoke flake on the bun |
| Starlight | 37 | ink blue #3d3436 / ink | four gold 4-point stars on the tutu |
| Firebird | 43 | coral #e26d5c / gold | flame plume: three teardrop paths behind the bun |
| Rainbow | 47 | pink / white | five soft arcs over the tutu (coral, gold, green, pale blue, lilac) |

**Stages** are one SVG backdrop each (gradient rect + a few static shapes), with the decoration layers drawn on top of every stage: Practice Room (cream wall, barre), Moon Night (deep blue gradient, crescent moon), Garden Hills (green hills, three flowers), Snow Field (pale sky; flakes fall only during Dance, at most 6 within the motion budget, static in calm mode and on every other screen), Seashore (teal gradient, two wave paths), Starry Sky (ink gradient, 9 static stars), Grand Theater (red velvet, gold frame). Darker backdrops sit inside the stage box; the page stays light.

**Music** tiles show the loop name and tempo word ("slow", "gentle", "waltz"); Quiet shows a closed music-box lid. **Sparkle style** tiles show one particle of the style; None shows an empty tile.

**How it evolves.** Rows fill on the fixed schedule above. Locked tiles are visible from day one in their fixed slot; the workout number appears only once that item has shipped (`shipped: true` in the catalog). After each performed recital the stage carries a new permanent decoration regardless of which stage she picks. Ambient sparkle count grows with Programs completed.

**Sensory notes.** No sound on entry; only tap-initiated ticks and previews. New tiles appear in a pre-drawn slot; nothing reorders. One row per screen keeps one decision per screen; the default path is one tap. No decoration or weather animates on this screen; only Pirouette's `lite-sway` and her tap Twirl move.

### 5.2 Make a dance (choreographer) — presets from workout 1, editor from workout 7

**How it works.** Inside step 2 (§3.7). Tapping "New dance" (or "Change" on a saved dance) opens the **editor**: one fixed instruction line, "Tap a move. It goes in the next empty slot."; the move strip of empty rounded slots; below it a fixed 2×4 **move palette**, big tiles (72 px, icon + one word), locked ones dimmed, with their number once shipped. Tap a move → it fills the next empty slot, Pirouette previews it once at normal speed, and its note plays. Tap a filled slot → it empties and later slots shift left. "Undo" removes the last move. When the slots are full, a palette tap makes the strip glow once (`lite-pop`) and plays no note, so the tap still does something. "Save" stores the dance as "Dance K" (K = count of all her saved dances, including put-away ones, + 1, so names never repeat) with an optional "Change name" button (h-14) that opens two rows of word tiles (Moon · Star · Garden · Snow · Rose · Sunny / Waltz · Dance · Twirl · Dream · Song · Steps → "Moon Waltz"); the keyboard is never required. Leaving the editor with unsaved moves asks once: "Save this dance?" [Save] [Don't save]. A one-move dance is valid. "Next: Dance" plays it.

**Pirouette's choice** is a virtual dance, never a row: every unlocked move once, in catalog order, up to the length limit. It grows on move days, which the ending card announces ("Pirouette's choice has Sauté now."), and it is always the first tile, so she never has to have made a dance. What it contained on any evening is snapshotted on that evening's row (§8), so posters never change afterwards.

**Moves** (pentatonic notes so every dance is a consonant tune; beats at the loop's tempo; display names are per-move strings so Jose can swap the ballet words, §10):

| Move | Key | N | Beats | Note | Motion (keyframes under `.pir[data-move="key"]`) | Calm pose (static transform under the same selector) |
|---|---|---|---|---|---|---|
| Plié | plie | 1 | 2 | C5 | `pir-plie`: legs scaleY 1 → 0.9 → 1 (origin at the foot), torso translateY 6, arms lower | legs scaleY 0.9, arms low |
| Reach | reach | 1 | 2 | E5 | `pir-reach`: arms to fifth position (rotate −150° / 150°), torso translateY −3 | arms overhead |
| Twirl | twirl | 1 | 4 | G5 | existing `lite-pirouette` 720° rotateY on the svg root | front pose, sparkles on |
| Arabesque | arabesque | 1 | 2 | A5 | `pir-arabesque`: back leg rotates −70° (origin at the hip), torso −8°, front arm forward | held arabesque |
| Sauté | saute | 9 | 2 | C6 | `pir-saute` (the `lite-hop` shape): translateY −14 twice + 4-particle puff | legs pointed, feet together |
| Curtsy | curtsy | 27 | 2 | D5 | `pir-curtsy`: plié + head tilt 12° + arm sweep out | curtsy held |
| Glide | glide | 33 | 4 | E5 | `pir-glide`: root translateX −40 → +40 px with `lite-sway` | offset +20 px, sway pose |
| Big spin | grand_spin | 41 | 4 | G5 + C6 | 1080° rotateY on the root + 6-particle burst at the end | front pose with a static burst |
| Bow | (implicit) | always last | 2 | final chord | `lite-bow`: torso rotates 26° (origin 50,100), arms 20°, 1.6 s | bowed |

Every keyframe's duration is `calc(var(--beat) * beats)`, with `--beat` set on the rig root from the song (60/bpm seconds), so a 2-beat Plié lasts 1.8 s at 66 bpm and 2.1 s at 56 bpm; Twirl's existing fixed-duration class gets the same treatment.

**How it evolves.** Palette 4 → 8 moves (9, 27, 33, 41); length 6 → 8 (14) → 10 (28) → 12 (42). Saved dances are the material of recitals and posters. "Put away" is one tap with a "Put it back" link; presets cannot be put away; a put-away dance still counts for naming and for the "Ten dances" rosette, so nothing goes backwards. "Change" edits the dance in place; past evenings keep their snapshot.

**Sensory notes.** Previews are single moves, never looped. Palette positions are fixed from day one. Building a dance composes a tune, so there is no wrong sequence.

### 5.3 The Dance with Sparkle catch (rhythm) — dance from workout 1; Sparkle catch off by default, available from workout 11, second lane from 34

**How it works.** Step 3 (§3.8). One beat clock drives everything: `AudioContext.currentTime` when music is on, a `setTimeout` clock at the same tempo when music is off or Quiet is chosen. Moves advance on the clock; the move strip highlights the current move.

Sparkle catch is a **layer, not a mode**, and it is **off until Jose turns it on** (`sparkle_taps`, default off; the preference is disabled with the note "from workout 11" until N_max ≥ 11). When on, the Dance screen carries the fixed line "Tap when the sparkle reaches Pirouette's hand. You can also just watch." One sparkle per move drifts from the top-left wing along a fixed soft arc to Pirouette's raised hand over two beats. A faint gold ring around her is static until her first catch ever, and pulses on the beat from then on, so the only new motion on the first evening is the sparkle itself. A tap anywhere on the stage while the sparkle is inside the ring (±400 ms of arrival) → a 6-particle burst and a soft bell. A tap at any other time → one small silent sparkle at the fingertip. A sparkle not caught passes behind her and fades. Caught sparkles accumulate as a soft radial glow on the stage floor (opacity 0.1 + 0.04 per catch, max 0.6) and persist through the Bow; `recordCatches(n)` adds them to `sparkles_caught` once at the Bow, including after Stop and after "Dance again". No number appears unless Jose turns on `sparkle_count`. **The dance plays identically whether or not she taps**: ignoring the sparkles is simply the dress rehearsal.

**How it evolves.** From workout 11 Jose can turn the lane on, after showing her once; the day he does is the day it appears, so the unlock table says nothing to her. From workout 34 a second lane from the right can be turned on so two sparkles per move arrive on alternating beats. Sparkle style follows the Get ready choice. Recitals run the layer across all their dances.

**Sensory notes.** Tempo 56–84 bpm, at most one sparkle every two beats per lane, generous window, no miss feedback, no score. The lane takes 1–2 of the screen's 12-element motion budget (§7); nothing faster than ~600 px/s, no flashes, no screen shake. The catch bell is the move's note one octave up only when that is C6 or lower; otherwise it is the same note with a 0.25 s decay, so nothing shrill ever plays. `sparkle_taps=false` removes the lane, the ring and the instruction line entirely. In calm mode the sparkle appears statically on Pirouette's hand for its window; a tap swaps in a static burst.

### 5.4 Recital — every fifth workout, or the next stage visit after it

**How it works.** On recital day the strip is unchanged. Get ready works as always; the look is written on today's row. On an on-time recital day Choose a dance shows "Today's dances": the **distinct** dances recorded on the Program's four rehearsal rows (positions 1–4 of Program P, by ordinal; duplicates collapsed by their `moves` snapshot, so 1–4 dances; a position with no row or no snapshot plays Pirouette's choice as it is today). Dance's button reads "Start the recital". `startDance` sets `recital_program = P` and `danced_at` in the same update, so the recital counts as performed only when it has started. The recital has a fixed shape regardless of content, so even one distinct dance is a recognisably bigger show: a static title card "Recital 2" (1.5 s, tap to skip), then each dance introduced by its own title card ("Dance 2 · Little Waltz", 1.5 s, tap to skip), then a **finale**, every unlocked move once in catalog order, ending in the Bow with every earned cat clapping. The earned cats sit in the front-row box and are still during the dances; they sway and clap only during the Bow. Sparkle catch runs if on. The Bow card reads "Recital 2 complete.", shows the poster, and "New on the stage: string lights". Stop is always available and still completes the recital (the row was written at "Start the recital"). On a day when an older recital is ready (§4), Choose a dance is the normal screen with "Recital 1 is ready. It plays first.", and Dance plays the recital, then a title card "Now your dance · Little Waltz", then her dance; her dance is the row's snapshot, so the next Program's poster is right.

**Length.** A 6-slot dance at 66 bpm is about 15 s; four distinct dances with title cards are about 70–90 s, plus a finale of about 15 s at four moves. At 12 slots and 56 bpm a dance is about 35 s, so a four-dance recital reaches about 2.5 minutes before a finale of about 30 s; with duplicates collapsed it is usually shorter.

**Poster** (3:4 SVG, derived): the Program's theme colour, Pirouette in the look of the row that performed the recital (for a skipped recital, the look of the Program's last rehearsal row), "Program 2" with the theme name as a subtitle, and one row of move icons per distinct dance from the snapshots. Saved nowhere; rendered from `rehearsals` on the Programs shelf.

**How it evolves.** Longer dances, more costumes and stages, more cats, stacking decorations. Recital 10 is the Season Finale with fireworks and the Season One poster (all ten posters in a grid). Recitals continue every 5 forever.

**Sensory notes.** Announced days ahead by the star on Today's Program line. No applause audio; cats clap visually, one slow chord ends it. Petals, confetti and fireworks are capped at 20 particles with static equivalents in calm mode and can be turned off with `bow_showers`.

## 6. Achievements and unlockables

Rosettes hang on the curtain tie-backs and appear on the Programs shelf. All are derived; none is calendar-shaped; none reads a score; none can be lost. Unearned rosettes are never shown anywhere, so none of them reads as a nudge to change a look she likes. Names say what happened.

| Rosette | Trigger (derived from) | Reward |
|---|---|---|
| First dance | first `rehearsals` row with `danced_at` set | gold rosette; Bow line "Your first dance." |
| First recital | row with `recital_program = 1` and `danced_at` set | Program 1 poster (every Program adds its own) |
| Made a dance | first saved non-preset dance (put away or not) | pink rosette; Bow line "You made a dance." |
| Caught a sparkle | first row with `sparkles_caught > 0` | rosette; Bow line "You caught a sparkle." |
| Three costumes | danced rows in 3 different costumes | rosette |
| Five stages | danced rows on 5 different stages | rosette |
| Ten dances | 10 saved non-preset dances, put-away ones included | rosette; "My dances" gets a second shelf line |
| 100 moves | 100 `movement_completions` on completed workouts | rosette |
| All ten cats | N_max ≥ 50 | rosette; the audience row is full at every recital |
| All eight costumes | N_max ≥ 47 (all eight Season One costumes) | rosette; Pirouette wears a tiny gold rosette pin on the Today done card |
| Season One | row with `recital_program = 10` and `danced_at` set | Season One poster grid; fireworks bow |
| Season Two | row with `recital_program = 20` and `danced_at` set (N ≥ 100) | Season Two poster; grand fireworks |

Unlockables by threshold are the catalog in §4.1 and §4.2. Unlocks derive from N_max, a persisted high-water mark bumped at Finish and never lowered, so reopening a workout never relocks a tile she wore yesterday. Programs and positions derive from N, so a reopened workout can shift today's position; that is accepted as rare (same as the cats) and nothing she chose or made is affected, because every evening's look and moves are snapshotted on its row.

## 7. Sparkle and sound

### Sparkle

Vocabulary: the existing 4-point gold star with `lite-sparkle` breathing, plus styles that change shape and colour only: Pink Hearts (#ec9fbd), Snowfall (white 6-point), Twinkles (gold + white 5-point), Colour Drops (one fixed soft colour per particle, no hue cycling), Blossoms (coral), Fireflies (gold, slow), and None.

Moments: ambient breathing around Pirouette during the dance (count = 6 + `floor(N/5)`, cap 12, in "lots"; fixed 3 in "some"); a 4-particle `lite-float` puff at each move start; a 6-particle burst on a sparkle catch; the floor glow pool; the `lite-pop` of today's circle at Finish; bow showers from decorations (petals at 25, confetti at 45, fireworks at 50) capped at 20 particles over 3 s, no more than one new particle per 150 ms.

**Motion budget, one per screen, regardless of settings.** Outside the Dance step nothing moves except Pirouette's `lite-sway` and her tap Twirl: no weather, no floating notes, no audience sway, no breathing decorations. During the Dance step the stage component has a budget of **12 moving elements** besides Pirouette's own moves, allocated in this order: stage weather first (Snow Field flakes, at most 6), then Sparkle catch lanes (1 each), then ambient sparkles fill the rest (never fewer than 3). The orchestra pit's notes and the audience are static until the Bow, where notes float, cats sway and clap, and bow showers (within their own 20 cap) replace the ambient sparkles.

Hard limits regardless of settings: nothing flashes faster than 2 Hz, no white flashes, no screen shake, no parallax, nothing moves faster than ~600 px/s, scale never exceeds 1.15 except Pirouette's own moves, all easing ease-in-out, animate only `transform` and `opacity`, never animated SVG filters.

Calm mode (existing `data-reduced-motion` on `<html>`): the calm block in `globals.css` gains one attribute rule for the rig, `:root[data-reduced-motion] .pir[data-move] * { animation: none }` (matching the attribute form the existing block already uses), followed by the static pose transforms under `:root[data-reduced-motion] .pir[data-move="plie"] .pir-leg-l { … }` and so on for every move, and every new class: `lite-bow`, `lite-curtain-open`, `lite-curtain-close`, `lite-sparkle-drift`, `lite-ring-pulse`, `lite-snowfall`, `lite-petals`, `lite-confetti`, `lite-fireworks`, `lite-notes-float`, `lite-glow`. A dance in calm mode is a slideshow of poses, one per move on the clock; ambient sparkles become three static dots, curtains jump, crossfades are instant, Sparkle catch is a static appear-and-tap.

### Sound

All synthesized through one shared `getAudioContext()` exported from `src/lib/sound.ts`, created or resumed only inside a pointer handler, through one master GainNode and a 6 kHz low-pass. `src/lib/music.ts` adds a lookahead sequencer (25 ms interval, schedules 100 ms ahead against `ctx.currentTime`) that exposes `start(song)`, `onBeat(cb)`, `stop()`, `preview(song, 2000)`, `playNote(midi, octaveUp?)`. `stop()` runs on Back, Done, Stop, unmount and `visibilitychange` (hidden); on `visibilitychange` the dance also goes to Bow. There is no pause.

| Sound | When | Spec |
|---|---|---|
| Start note | Start on Today | C5 sine, 0.6 s decay (new unless `sound.ts` already has it) |
| Done chime | each Done | two notes (exists) |
| Finish chord | Finish | rising chord (exists) |
| Tile tick | Get ready tile tap | 80 ms triangle, gain 0.15 |
| Music preview | music tile tap | 2 s of the loop, 300 ms ramps |
| Move note | editor tap and each move start in the dance | pentatonic C D E G A, 0.5 s decay |
| Catch bell | Sparkle catch | the move's note +1 octave when the result is ≤ C6, otherwise the same note with 0.25 s decay; sine, 0.4 s decay, gain never above the move note and never above music +3 dB |
| Final chord | Bow | 1.8 s decay |

Music loops are 8-bar patterns of scheduled oscillators. Every `Song` requires `{ bpm, beatsPerBar }` because the beat clock, sparkle drift and move durations all need both: Music Box (66 bpm, 3/4, triangle + sine one octave up at 0.3, 5 ms attack, 0.8 s decay), Harp Song (60 bpm, 4/4, sine through a 2 kHz low-pass, 1.2 s decay), Silver Bells (72 bpm, 3/4, sine + partial at 2.76×, 1.5 s decay), Rain Piano (56 bpm, 4/4, sparse notes; the filtered-noise bed is later polish), Ocean Waves (60 bpm, 4/4, slow detuned pads), Ballroom Waltz (84 bpm, 3/4). Quiet is no song; the clock runs at 66 bpm. A `Song` may instead point at a small audio file (under 200 KB) with its bpm and meter; the beat clock and everything above work unchanged. Decide after Phase 0 (§9).

Rules: no sound ever plays without a tap; every start and stop is a gain ramp of at least 300 ms (music in 1.5 s, out 1–2 s); no crowd or applause audio; chimes stay louder than music.

### Controls (preferences card on the Friends tab, in this order)

| Setting | Column | Default | Effect |
|---|---|---|---|
| Sounds | `sound` (exists) | on | all chimes and notes |
| Music | `music` | on | loops only (Quiet is also a tile in the flow) |
| Volume | `volume` | soft | master 0.25 soft / 0.5 medium, never higher |
| Sparkle amount | `sparkle_amount` | lots | lots = 6 + Programs (cap 12) ambient; some = 3, no bursts beyond the catch burst |
| Sparkle catch | `sparkle_taps` | off | on adds the lane, ring and instruction line; disabled with "from workout 11" until N_max ≥ 11; second lane from 34 |
| Show caught sparkles | `sparkle_count` | off | on adds "You caught 12 sparkles." to the Bow card, no denominator |
| Bow showers | `bow_showers` | on | off removes petals, confetti and fireworks at the Bow |
| Calm mode | `reduced_motion` (exists) | off | every animation off, poses only |

## 8. Data model

### New migration `migration-0001-dance.sql` (the repo has only `schema.sql`; use 0002 only if a 0001 exists by then)

```sql
alter table workouts add column stage_closed_at timestamptz null;   -- "Done for today"

create table dances (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  moves text[] not null check (array_length(moves, 1) between 1 and 12),
  is_preset boolean not null default false,
  preset_key text unique null,
  created_at timestamptz not null default now(),
  archived_at timestamptz null                                        -- "Put away"
);
insert into dances (name, moves, is_preset, preset_key) values
  ('Little Waltz', '{plie,reach,twirl,plie,reach,arabesque}', true, 'little_waltz'),
  ('Twirl Song',   '{reach,twirl,arabesque,twirl}',          true, 'twirl_song');

create table rehearsals (
  workout_id      uuid primary key references workouts(id) on delete cascade,
  costume         text not null default 'classic',
  stage           text not null default 'practice_room',
  music           text not null default 'music_box',                   -- 'quiet' allowed
  sparkle         text not null default 'gold',                        -- 'none' allowed
  dance_id        uuid null references dances(id) on delete set null,  -- null = Pirouette's choice
  dance_name      text null,                                           -- snapshot at "Start the dance"
  moves           text[] null,                                         -- snapshot of what was performed
  recital_program int  unique null,                                    -- set at "Start the recital" only
  sparkles_caught int  not null default 0,
  danced_at       timestamptz null                                     -- set at "Start the dance" / "Start the recital"
);

alter table settings
  add column music          boolean not null default true,
  add column volume         text    not null default 'soft'  check (volume in ('soft','medium')),
  add column sparkle_amount text    not null default 'lots'  check (sparkle_amount in ('some','lots')),
  add column sparkle_taps   boolean not null default false,
  add column sparkle_count  boolean not null default false,
  add column bow_showers    boolean not null default true,
  add column high_water_n   int     not null default 0,   -- highest N ever reached; bumped at Finish, never lowered
  add column stage_start_on date null;                    -- null = every completed workout counts
```

Move keys: `plie, reach, twirl, arabesque, saute, curtsy, glide, grand_spin` (Season Two adds `wave_arms, final_pose`); display names are separate strings. Costume, stage, music and sparkle values are catalog keys plus `quiet` and `none`. `settings.ts` mirrors every default and never throws. `dances` and `rehearsals` go into `scripts/backup.mjs` in Phase 1a, the moment rows can exist.

Write rules: `setLook(partial)` upserts today's row and touches only the four look columns. `startDance(danceId | null)` writes `dance_id`, `dance_name` and `moves` (the dance's moves, or `pirouettesChoice(N_max)` at that moment; the latest dance of the evening is the record), sets `danced_at` only if it is null, and sets `recital_program = P` only when a recital plays and the column is null, all in one update. `recordCatches(n)` adds to `sparkles_caught`. Nothing ever clears `danced_at` or `recital_program`.

### Derived, no tables (`src/lib/dance-progress.ts`, pure, mirrors `collection.ts`)

- `N` = count of workouts with `completed_at` set (and `performed_on >= stage_start_on` when set). Cats keep using the total.
- `N_max = max(N, settings.high_water_n)`: unlocks, tile numbers, slot counts and rosette thresholds use N_max, so nothing ever relocks.
- `todayN = N + (todayComplete ? 0 : 1)`; the Program line, the "Next:" countdown and `isRecitalDay` on both tabs use todayN, so nothing displayed changes at Finish.
- `program = ceil(todayN/5)`, `position = (((todayN-1) % 5) + 5) % 5 + 1` (guarded; todayN is never 0), `isRecitalDay = position === 5`.
- `ordinal(workout)` = count of completed workouts in the same filtered set with `performed_on <= its performed_on`; a row's Program = `ceil(ordinal/5)`, its position = `((ordinal-1) % 5) + 1`.
- `performedRecitals` = rows with `recital_program` and `danced_at` set; `maxPerformed` = their highest program (0 if none).
- `readyRecital` = the largest P with `5P <= N` and `P > maxPerformed`, or none; older unperformed recitals are skipped, never performed.
- `programDances(P)` = distinct `moves` snapshots of rows at positions 1–4 of Program P, in order; a missing position or null snapshot plays `pirouettesChoice(N_max)`.
- `decorations` = every decoration whose program `<= maxPerformed` (plus Season Two gold upgrades the same way). Decorations are never part of `newlyUnlocked`.
- `unlocked(N_max)`, `nextUnlock(todayN)` (shipped items only, Season Two only when N_max ≥ 50, falling back to the next recital), `newlyUnlocked(from, to)` (shipped wardrobe, move and length items only), `slotCount(N_max)`, `ambientSparkles(N, amount)` with Programs completed = `floor(N/5)`, from the catalog in `src/lib/dance-content.ts`, where every item is `{ key, name, kind, unlockAt, season, shipped, ... }` and `unlockAt` is data that never changes once displayed.
- `pirouettesChoice(N_max)` = unlocked moves in catalog order, truncated to `slotCount(N_max)`.
- Audience = `computeEarnedCats(total)`.
- Posters = `programDances(P)` plus the look of the row with `recital_program = P`, or of the Program's last rehearsal row when the recital was skipped.
- "New since last time" = `newlyUnlocked(ordinal of the latest workout with a rehearsals row, N-1)`; today's item is announced on the ending card and the banner's first line instead. The banner retires when today's row exists.
- Nav dot = today's workout complete and today has no row with `danced_at`.
- Current step on load = closed screen if `stage_closed_at` is set, otherwise Get ready.
- All twelve rosettes from N_max, `dances`, `rehearsals` and `movement_completions`.

### Code placement

- `src/lib/dance-content.ts` (catalog: items with `shipped` and `season`, moves with beats, pitches and display names, programs, decorations), `dance-progress.ts` (pure), `music.ts` (sequencer, songs), `dance-player.ts` (`useDancePlayer`: advances `data-move` on the beat, sets `--beat`, restarts keyframes with the reflow trick, cleans up on unmount/Back/visibilitychange).
- `src/actions/dance.ts`: `getStageData()`, `setLook(partial)`, `startDance(danceId)`, `recordCatches(n)`, `closeCurtains()` / `openCurtains()` (`workouts.stage_closed_at`). `src/actions/saved-dances.ts`: `saveDance`, `putAwayDance`, `putBackDance`. All throw friendly `Error` and `revalidatePath('/dance')`, `'/collection'`, `'/'`.
- `src/components/schedule-strip.tsx` extracted from `today-view.tsx` and shared. `src/components/dance/`: `dance-flow.tsx` (state machine + strip), `get-ready.tsx`, `picker-row.tsx`, `choose-dance.tsx`, `choreographer.tsx`, `performance.tsx`, `bow.tsx`, `stage.tsx` (backdrop, decorations, curtains, audience, motion budget), `pirouette.tsx` (rig, replaces `ballerina-cat.tsx`), `costume-overlays.tsx`, `poster.tsx`.

### Pirouette rig (iPad Safari rules)

`<div class="pir-wrap" style="perspective: …"><svg viewBox="0 0 100 120" class="pir" data-move={move} data-costume={key} style={costume vars + --beat}>` with groups back to front: `.pir-leg-l`, `.pir-leg-r` (hips at (45,100) and (55,100)), `.pir-torso` (body ellipse at (50,86), tutu, `.pir-costume-body`, `.pir-arm-l` shoulder (38,74), `.pir-arm-r` shoulder (62,74), `.pir-head` circle r=26 at (50,38) pivoting at the neck (50,64), `.pir-costume-head`), then `.pir-sparkles`. Every group has `transform-box: view-box` so `transform-origin` is written in viewBox units. Motion is attribute-driven: `.pir[data-move="plie"] .pir-leg-l { animation: pir-plie calc(var(--beat) * 2) ease-in-out both }` and so on, animating inner groups with 2D transforms only; **rotateY (Twirl, Big spin) is applied to the `<svg>` root inside `.pir-wrap`, because Safari ignores 3D transforms on inner SVG elements.** Restarting the same keyframe between moves uses the reflow trick on the wrapping div (clear `data-move`, read `wrap.offsetWidth` or `getBoundingClientRect()`, set the next); `offsetWidth` does not exist on `SVGSVGElement`. Costume colours are CSS custom properties on the root so colourways cost zero shapes. Keep the stage SVG under a few hundred nodes.

## 9. Build plan

**Phase 0 · iPad spike (half a session).** Pirouette rig with the four base moves and Bow; rotateY on the root; `transform-box` origins; `--beat` durations and the reflow restart on the wrapper; one Music Box loop through the shared AudioContext resumed on tap; stop on `visibilitychange`. Test on the real iPad before anything else. Decide synth vs small audio files here.

**Phase 1 · Stage foundation (2–3 sessions total, shipped in two parts). The Twirl button stays live until 1a is ready; there is no "before her next workout" deadline. Set `stage_start_on` to the 1a ship date so her first stage visit has exactly one new thing.**

*1a (ship first, replaces the Twirl button):* `migration-0001`; full catalog and progress lib with every `unlockAt`, `shipped` and `season`; `music.ts` with Music Box only; `ScheduleStrip` extracted and reused; Today's ending card, slipper states, done state and nav dot; Get ready with Costume, Stage and Music rows (Classic + Swan, Practice Room + Moon Night, Quiet + Music Box + Harp Song; locked tiles with numbers only for shipped items; "New today" banner line; tap-to-Twirl); Choose a dance as the fixed 2×2 tile grid (Pirouette's choice, two presets, "New dance" dimmed without a number); Dance with four moves, curtains, ambient sparkles within the budget, move strip, Stop; Bow with final chord, "Done for today" (persisted `stage_closed_at`, "The stage is closed for today.", "Open the curtains") and "Dance again"; `dances` and `rehearsals` in `backup.mjs`; calm block updated.

*1b (before her 5th workout):* Program line and "Next:" line; Recital (fixed shape with title cards and finale, "Recital N complete.", ready-until-performed, newest only, recital-then-her-dance on a late day); decorations footlights and string lights; cat audience at the Bow; Sparkle style row (Gold + None); "New since last time" banner line; preferences Music, Volume, Sparkle amount, Bow showers.

Out of Phase 1: editor, posters, rosettes, Sparkle catch, everything unlocking after 10.

**Phase 2 · Choreographer and Programs shelf (1–2 sessions). Ship before her 7th workout; if late, the "New dance" tile simply stays promise-free (no number) and the "Next:" line skips it.**
In: editor (instruction line, palette, slots, one-tap undo, full-palette glow, auto-name "Dance K" with optional word tiles, "Save this dance?" on leaving, save, put away with "Put it back"); "My dances" row; posters and the Programs shelf with rosettes on the Friends tab (Program 1's poster appears retroactively because it is derived); content through workout 15 (Sauté, Sugar Plum, 8 moves, garlands).

**Phase 3 · Sparkle catch (1 session). No unlock deadline: the lane is off until Jose turns it on; ship it before he wants to show her.**
In: drifting sparkle on the beat clock, ring static until the first catch then pulsing, ±400 ms window, burst and capped bell, fingertip sparkle, floor glow, `sparkles_caught` persisted at the Bow, `sparkle_taps` and `sparkle_count` settings with the "from workout 11" gate, instruction line, calm-mode static variant; second lane behind the gate at 34.

**Phase 4 · Content drops (ongoing, 20–40 minutes per item, each shipped before its unlock day or left promise-free until it is).**
Remaining costumes, stages, music loops, sparkle styles, moves (Curtsy, Glide, Big spin), 10 and 12 moves per dance, decorations 20–50, Season One poster and fireworks. No logic changes: catalog rows with `shipped: true`, overlay paths, note patterns, and selectors in the calm block.

**Phase 5 · Season Two and tuning (months out, half a session per Program).**
Colourways, stage variants, two loops, two moves, gold decorations, Crown at 97; whatever watching her play suggests (window width, default sparkle amount, which pickers she skips).

**Rule for every phase:** a number she has seen never changes. `unlockAt` is data; an item whose code has not shipped carries no number and is skipped by "Next:", and when the day arrives without it, nothing is announced and nothing is relabeled. An unlock day never arrives with a promise it cannot keep.

## 10. Open questions for Jose

Each has a default already chosen above; a "no" is a constant or a setting, not a rewrite.

1. **Words.** Does she use "rehearsal", "recital", "Program", "stage", "Get ready", "Choose a dance" the same way, or does she say "show", "practice", "dance", "pick"? Copy strings are centralized to swap.
2. **Session vs menu.** She asked for all three games. Is one fixed Get ready · Choose a dance · Dance · Bow session right, or would she rather choose which game to play each evening?
3. **Program length.** Five workouts per Program (about 12 days at 3 a week). Three or four would make recitals more frequent; the unlock table would need re-spacing.
4. **Numbers.** Keep every number off (default), or turn on "You caught 12 sparkles." on the Bow card?
5. **Locked tiles.** Visible in place, with "at 13" once shipped (default), or hidden until unlocked, or only the next one shown?
6. **Get ready layout.** Choice cards with one row per screen (default), or all four rows on one screen for fewer taps?
7. **Dance names.** Auto "Dance K" with optional word tiles (default), word tiles first, or the keyboard?
8. **Ending.** Should "Open the curtains" exist for free play after "Done for today" (default), or should the stage stay closed until tomorrow?
9. **Rest days.** Should saved dances or posters be watchable on a day with no finished workout? Default no, to keep workout → stage literal.
10. **Recital size and length.** Up to about 2.5 minutes at 12 moves plus a finale, with cats, decorations and bow showers. Too long or too much? Options: cap the recital at the two newest dances, skip the finale, or turn bow showers off.
11. **Music.** Synthesized music-box and harp timbres, or a few recorded loops Jose picks? Phase 0 decides; the clock works with either. Is a 2 s preview on a music tile welcome or startling? Is a Quiet tile in the row useful?
12. **Sparkle default.** "lots" (6 growing to 12 ambient) or "some" (3)? Are the 720° and 1080° spins at 220 px comfortable to watch?
13. **Calm mode.** Does she use it? If yes, test the held-pose dance with her before Phase 2.
14. **Darker backdrops.** Moon Night, Starry Sky and Seashore are dark inside the stage box on a light page. Fine, or keep every stage light?
15. **Today's Program line.** Two short rows (circles + "Next: …") under the strip: useful or visual noise?
16. **Starting count.** Default is `stage_start_on` = the Phase 1a ship date, so the stage starts at 1 and the first visit shows one new thing. Or let her existing workouts carry over (the "New since last time" banner would list several unlocks at once)?
17. **Recital day strip.** Default keeps four identical steps with the recital inside Dance. Would a visibly different "Recital" step be better for her?
18. **Backups.** Dances and rehearsals are her creations and cannot be re-derived; the nightly backup schedule is still commented out. Turn it on once repo secrets exist?
19. **Sparkle catch.** It is off by default and nothing announces it. When Jose wants it, show her once with the instruction line and turn it on in preferences; is the ring staying static until her first catch the right first evening?
20. **Move names.** Does she know Plié, Arabesque, Sauté and Curtsy, or should the tiles read "Bend", "Reach", "Spin", "Leg up", "Jump"? Keys stay as they are; the display name is a per-move string she will read 6–12 times per dance in the strip.
