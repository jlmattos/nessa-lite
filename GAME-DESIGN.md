# GAME-DESIGN.md — Pirouette's Stage

## 1. Pitch

**For Nessa (Jose can read this aloud):**

When you finish your workout, Pirouette's stage opens. You pick her costume, her stage and her music. You pick a dance, or make your own out of ballet moves. Then she dances it for you, with sparkles. Every workout is one rehearsal. After four rehearsals comes a recital: Pirouette dances all of that Program's dances while your cat friends watch from the front row, and the stage gets something new that stays forever. The more workouts you do, the more Pirouette has to wear, the more moves she knows, and the grander her stage becomes.

**For the developer:** one fixed post-workout session (Get ready · Choose a dance · Dance · Bow) drawn with the same schedule strip as Today. The three requested game shapes live inside it: Get ready is the dress rehearsal, Choose a dance holds the choreographer, and the rhythm game is an ignorable sparkle layer on top of the dance, on from the first evening and switchable off in preferences. Every reward is derived from the completed-workout count or from rows she created, exactly like the cat shelf. Rest days change nothing. Nothing is ever taken away, and no number she has read ever changes.

## 2. Principles

1. **One session, same shape every day.** The stage is a four-step strip in the same visual grammar as Today, in the same order, with the same "Now … then …" line. There is no menu of games. On a recital day the strip keeps its four steps and their order, but the third step is drawn big: a larger gold star labelled "Recital" in place of the slipper labelled "Dance" (Jose: big days marked big), and what plays inside it is the recital.
2. **Four taps is a complete evening.** Every step has the last choice preselected and one full-width bottom button. Next · Next · Start the dance · Done for today.
3. **The workout stays plain; the stage is the reward.** No sparkle, music or counts during the workout. Contrast makes the stage feel special.
4. **One new thing per workout at most, announced before it appears.** Wardrobe and feature unlocks never land on a cat day or a recital day. The only double days are day 1 (Mochi arrives and the stage opens) and the cat-and-recital days (5, 20, 25, 35, 50), where the cat appears on the Friends tab and the decoration at the Bow, each announced in its own place. This holds because the cats and the stage count the same thing: every completed workout (§8). Locked items are visible in their fixed slot; the workout number under a locked item appears only once that item's code has shipped, and a number that has been shown never changes. A "Next: …" line always says what is coming and is never empty.
5. **Nothing can be wrong.** Every tap during the dance does something; a miss does nothing. A one-move dance is valid. Undo is one tap. No scores, streaks, timers, or "try again" anywhere. Rest days are invisible. Unearned rosettes are never shown.
6. **Clear beginning and ending.** "Start the dance" opens the curtains. The Bow closes them and says "The end." "Done for today" is persisted, visible from both tabs, and reversible.
7. **Sparkle and sound are capped, slow, consonant, tap-started, and switchable.** There is one moving-element budget per screen (§7). Calm mode (a kill switch Jose keeps for testing, §7) switches every animation off.
8. **Everything derives from workout history.** The only stored things are what she makes (dances), what she chooses (today's look and dance, snapshotted so history never changes), and settings.
9. **Literal copy, fixed strings, one name per thing.** Steps are named for what she does there: "Get ready", "Choose a dance", "Dance", "Bow". The tab is "Stage" and the button that leads to it says "Go to the stage". Every catalog item has a name used for nothing else, and every announcement carries the kind word: "New today: Swan costume", "Next: Choose a dance", "Start the dance", "The end.", "Done for today", "at 13", "Tap when the sparkle reaches Pirouette. You can also just watch."

## 3. A session, start to finish

Throughout, N = number of completed workouts, the same count the cats use (see §8 for the high-water mark N_max used for unlocks). For anything shown on Today before Finish, `todayN = N + (todayComplete ? 0 : 1)`, so the morning describes today's upcoming workout and nothing displayed changes at Finish. Program = `ceil(todayN/5)`. Position in Program = `((todayN-1) % 5) + 1`: positions 1–4 are rehearsals, position 5 is recital day.

### 3.0 Opening the app (rest state)

**Today tab** (unchanged layout): the routine the rotation suggests, Start button (h-16), and the visual schedule strip: one icon per movement, then the ballet-slipper icon (Dance) as the last step. Current step ringed in coral. Line: "Now: Arm circles · then: Wall sit." The slipper has three states: outline (not yet), ringed coral (the stage is open and she has not danced yet today), dotted (today's `rehearsals` row has `danced_at`). On recital day (position 5 of todayN) the slipper at the end of Today's strip is a larger gold star labelled "Recital" all day, with the slipper's three states (outline, ringed coral, dotted). On every other day there is no star on the strip; on Today the star means only "recital".

Under the strip, the **Program line** (new, static, two short rows):

- Row 1: four 10 px circles and a 12 px star. Filled coral = rehearsal done this Program; coral outline = today's position; the star = recital day. Today's circle (or the star) fills at Finish; that is the only per-day completion mark. Text beside them, in this priority: if today is position 5 and Recital P has not been performed, "Recital 1 today."; else if today is position 5 and Recital P has been performed, "Recital 1 complete." (the Bow card's words); else if an older recital is ready (§4), "Recital 1 is ready." with that Program's four circles filled and the star ringed; else "Rehearsal 3 of 4".
- Row 2: "Next: Swan costume in 2 workouts" (the next **shipped** catalog item, `k = unlockAt − todayN`; "in 1 workout" means the workout after today). When `k = 0` it reads "Today: Swan costume". When no shipped item lies ahead (between 50 and Season Two, after 100, or whenever a phase is late), or the next recital comes sooner than the next shipped item, it reads "Next: Recital 11 in 3 workouts", which is always true because recitals are every 5 forever (an item and a recital never share a day, §2, so there is no tie). The day-1 base kit is never announced as items: on workout 1 the line reads "Today: the stage opens." before and after Finish.

**Stage tab** (route stays `/dance`; the bottom-nav label is "Stage"): closed curtains, Pirouette resting (closed-arc eyes, `lite-sway` only), "Finish today's workout. Then Pirouette dances." and the same Program line. Nothing moves otherwise, nothing sounds.

### 3.1 Start

Tap Start. This gesture creates or resumes the shared AudioContext and plays one soft note (C5 sine, 0.6 s decay). The first card expands; the others stay compact. Strip highlights step 1.

### 3.2 Steps

Each Done tap: the existing two-note chime, the card checks and collapses (`lite-pop`, 250 ms), the strip icon gets a static gold dot, and the "Now … then …" line advances. Undo is one tap on the card. No confetti, no timers, no counts.

### 3.3 Last step

When the final movement is current: "Now: Wall sit · then: Dance"; on recital day "then: Recital", matching the star (§3.5).

### 3.4 Finish

Finish (h-16) → one confirmation sheet "Finish today's workout?" [Finish] [Not yet]. On Finish: the existing rising chord; today's circle in the Program line fills (`lite-pop`); the slipper (or the Recital star) becomes the current step, ringed coral, because dancing is literally what is next. Today then shows the **ending card**: Pirouette (static, in her last chosen look), "Workout done.", one optional line "New today: Swan costume" (only if N is the unlock day of a shipped item; on a move day it reads "New today: Sauté, a new move. Pirouette's choice has Sauté now." and Pirouette performs the new move once when the card appears (in calm mode she stands in her front pose and the line alone announces it); on a length day it reads "New today: longer dances, 8 moves"), and one button "Go to the stage". Nothing navigates by itself. The Stage tab icon in the bottom nav gets a 6 px gold dot while today's workout is complete and no `rehearsals` row for today has `danced_at`; once she has started a dance the dot is gone for the day and nothing brings it back.

### 3.5 The stage opens (/dance)

The current step on opening is derived, never remembered in the browser: `workouts.stage_closed_at` set → the closed screen (§3.10); otherwise **Get ready**, with today's row (if any) preselected. If the row already has `danced_at`, the Dance and Bow steps show their dots so she can see she has danced; tapping through plays again.

The **dance strip** is rendered by the same `ScheduleStrip` component as Today: **Get ready** (dress icon) · **Choose a dance** (music-score icon) · **Dance** (ballet slipper) · **Bow** (clapping hands). Current step ringed in coral, done steps dotted, line "Now: Get ready · then: Choose a dance". On recital day the third step is the larger gold star labelled "Recital", in the same slot and order, and the "then:" that points at it says "Recital".

### 3.6 Get ready

Pirouette at 220 px in her last chosen costume on her last chosen stage, the music name under her. A tap on Pirouette (pointer up with less than 8 px of movement and no scroll begun) does one Twirl with a chime: the zero-decision action, available on every idle Pirouette while the stage is open.

Above the choice cards, one quiet **banner slot**, present only when it has something to say, up to two lines in fixed order: "New today: Swan costume" (the same sentence as the ending card) and "New since last time: Harp Song music · Swan costume" (shipped wardrobe, move and length items that unlocked on workouts whose stage she never opened; decorations and preferences are never listed, see §8). No tap is required to dismiss it; it retires when today's row exists (§5.1).

Under her, a 2×2 grid of **choice cards**: Costume · Stage · Music · Sparkle style. Each card shows the current pick as one 72 px tile and its name. Tapping a card opens that **one row as its own screen**: 72 px tiles in fixed catalog order wrapped four per line so every tile is always on screen (no horizontal scrolling anywhere in the flow), chosen tile ringed coral, locked tiles dimmed with "at 13" under them once that item's code has shipped and with no number before, today's new tile with a static gold outline. Season Two tiles are hidden until N_max ≥ 50. The Music row begins with a permanent **Quiet** tile (no loop; the beat clock runs at 66 bpm) and the Sparkle style row with a permanent **None** tile. Tapping a tile applies it with a 300 ms crossfade and an 80 ms triangle tick; a music tile also plays a 2 s preview (300 ms ramps). "Back to Get ready" (h-16) returns. Nothing is required: the bottom button "Next: Choose a dance" is always enabled and the defaults are yesterday's choices.

### 3.7 Choose a dance

Pirouette small (120 px) at the top left; at the right, the **move strip** of this dance's moves drawn exactly like the schedule strip (6 slots at first, later 8/10/12). Below, a fixed 2×2 grid of tiles that never reorders: **Pirouette's choice** (slipper), **Little Waltz** (slipper), **Twirl Song** (slipper), **New dance** (dimmed until the editor unlocks; "at 7" appears only once the editor has shipped). Under the grid, "My dances": her saved dances newest first (empty until she saves one). The last-danced dance is preselected. Default path: "Next: Dance".

Tapping "New dance" or a saved dance's "Change" button opens the editor (§5.2). On an on-time recital day (position 5) this screen instead shows "Today's dances": the Program's 1–4 dances as read-only tiles, and the button reads "Next: Recital". On a day when an older recital is ready (§4), the screen is the normal Choose a dance with one line above the grid: "Recital 1 is ready. It plays first."

### 3.8 Dance

The stage fills the width (4:3) with every decoration earned so far; the move strip for this dance sits under it. Before the curtains open the screen carries only the stage, the move strip and one button: "Start the dance" ("Start the recital" whenever a recital plays first: on recital day, and on the visit after a late one). On tap: `startDance(danceId)` writes the row (§8); curtains part over 2.5 s (tap anywhere skips); music fades in over 1.5 s; Pirouette performs each move for its beats at the loop's tempo, the current move ringed in the strip exactly like "Now" on Today. Ambient sparkles breathe around her within the screen's motion budget. If Sparkle catch is on, its layer runs on top (§5.3) and one fixed line sits under the stage for the whole dance: "Tap when the sparkle reaches Pirouette. You can also just watch." A "Stop" button (h-14, top right) fades the music over 1 s and goes to Bow. If the page is hidden mid-dance (`visibilitychange`), the sequencer stops and the flow goes to Bow, so she never returns to a half-finished dance.

### 3.9 Bow

Pirouette bows (`lite-bow`, 1.6 s). The earned cat friends in the front-row box do one small clap (`lite-flex`). A final slow chord (1.8 s decay). Curtains close over 3 s, with any bow shower earned (petals, confetti, fireworks; `bow_showers` on) capped at 20 particles, no more than one new particle per 150 ms. `recordCatches(n)` runs once here, including after Stop.

Card: "The end." then "Rehearsal 3 of 4." On recital day: "Recital 2 complete." with the poster and "New on the stage: string lights" (one line, naming every decoration that became visible with this recital). Plus any rosette line earned today ("You made a dance."). Two buttons: **Done for today** (primary) and **Dance again** (secondary; replays exactly what just played, recital included, nothing more is written except catches).

### 3.10 Done for today (the persisted ending)

"Done for today" writes `workouts.stage_closed_at = now()`. The curtains close and the Stage tab reads "The stage is closed for today." with one small button "Open the curtains" (clears `stage_closed_at`; the stage reopens at Get ready for free play, the nav dot does not return, and nothing more is earned). Today now shows the done state: every strip icon dotted, the slipper (or the Recital star) dotted, today's circle filled, Pirouette in today's costume, "Today is done." and the Program line. Reopening the workout (clearing `completed_at`) also clears `stage_closed_at`. The card's link reads "Reopen workout", and it is not shown while the stage is closed (her way back then is "Open the curtains"), so "The stage is closed for today." never sits beside a button that un-finishes her workout.

### 3.11 Next day

Everything is in the same place. A day she does not open the app is a rest day; no message about it anywhere.

## 4. The long-term arc

**The story.** Pirouette has joined the theater for her first Season. Every workout Nessa finishes is one of Pirouette's rehearsals; every five rehearsals Pirouette gives a recital; every recital leaves the stage grander than before. Ten recitals make the Season, and the Season ends with fireworks and a poster of everything they did together. The story is told by the Season map (below) and by the stage itself, never by text she has to read: each Program has a theme that names its poster, and every recital adds a visible, permanent decoration. Jose's brief: the mini-game must always read as one chapter of this longer story, so that finishing the next workout is how the story continues. The stage is locked until today's workout is finished, and the locked stage says so in one sentence ("Finish today's workout. Then Pirouette dances.").

- **One finished workout = one rehearsal.** Five consecutive completed workouts, by count, not calendar, = one **Program**. Positions 1–4 are rehearsals; position 5 is **recital day**.
- **Recitals stay ready until performed, and only the newest is performed.** Recital P becomes ready at N ≥ 5P and remains ready until a `rehearsals` row has `recital_program = P` and `danced_at` set. If she finished workout 5 but never opened the stage, workout 6's stage visit plays Recital 1 first and then her chosen dance (strip unchanged; Today says "Recital 1 is ready"). If more than one recital is ready, only the newest is performed; the older ones are skipped, their posters still derive from their rehearsal rows, and their decorations arrive together with the newest recital's.
- **Ten Programs = Season One** (50 workouts, the same cap as the cat shelf). Season Two runs 51–100 with content only; the daily flow never changes.
- **"The game gets better" means six visible, permanent things:**
  1. **The stage accumulates decorations after every performed recital**, present every day afterwards on every stage, no choice needed. Decorations derive from the highest performed `recital_program`, so the Bow card is their one announcement.
  2. **The wardrobe fills in**: 8 costumes, 7 stages, 9 music loops (plus Quiet), 5 sparkle styles (plus None) by 50.
  3. **The choreographer grows**: 4 → 8 moves, 6 → 12 moves per dance.
  4. **The sparkle grows**: ambient sparkles = 6 + Programs completed (`floor(N/5)`, cap 12 before the motion budget) in "lots"; Sparkle catch is on from the first evening and gains a second lane at 34 (§5.3).
  5. **Recitals grow by themselves**: they replay her own dances, in more costumes, on bigger stages, with more cats in the audience (cats unlock at 1, 3, 5, 8, 12, 16, 20, 25, 35, 50).
  6. **A Season map** on the Friends tab, next to the cats: ten poster slots along a winding path, one per Program, with every Program's theme name visible from day one (like the locked tiles), the current Program ringed in coral, and each Program's poster filling its slot once a recital at or after it has been performed (a skipped recital's poster derives from its rehearsal rows, §8). Months of work are visible in one place, and so is the road ahead. At the Season One finale the Bow card adds "Season Two starts next time." and the map gains a second path of ten slots for Programs 11–20, so the road never looks finished.
- **Program themes** name the posters and group the content so each Program feels like one chapter. The theme word appears only on the poster and the Season map, never in a Bow card or an announcement. A theme may share its name with one item inside its own Program (Sugar Plum, Starlight, Grand Theater, Rainbow); the kind word on every announcement keeps them apart, and a theme name the map has shown never changes:

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

Cat days (1, 3, 5, 8, 12, 16, 20, 25, 35, 50) carry no wardrobe or feature unlock: the cat is the new thing (day 1 is the one exception: Mochi and the stage opening, §2). The cats and the stage count the same N, so these holes always line up. Recital days (multiples of 5) bring their decoration only, at the Bow. The only workout with nothing new of its own is 49. Every other workout brings one item. Every catalog item has a unique name across all kinds, and every announcement carries the kind word.

| N | Unlock | Kind |
|---|---|---|
| 1 | Stage opens. Costume Classic, stage Practice Room, music Music Box (plus the permanent Quiet tile), sparkle style Gold (plus the permanent None tile), moves Plié · Reach · Twirl · Arabesque, 6 moves per dance, presets Pirouette's choice · Little Waltz · Twirl Song, the Sparkle catch lane (on) | base |
| 2 | Harp Song | music |
| 4 | Swan | costume |
| 5 | Recital 1 → footlights | decoration |
| 6 | Moon Night | stage |
| 7 | New dance (the editor) | feature |
| 9 | Sauté | move |
| 10 | Recital 2 → string lights | decoration |
| 11 | Candy Waltz | music |
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
| 29 | Puddle Hop | music |
| 30 | Recital 6 → chandelier | decoration |
| 31 | Ocean Waves | music |
| 32 | Seashore | stage |
| 33 | Glide | move |
| 34 | Sparkles from both sides (second Sparkle catch lane) | feature |
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
| 48 | Carnival Parade | music |
| 50 | Recital 10 → fireworks, Season One poster | decoration |

Totals at 50: 8 costumes, 7 stages, 9 music loops, 5 sparkle styles, 8 moves, 12 moves per dance, 10 decorations, 10 posters. Longest gap between unlocks: 2 workouts (48 → 50); the "Next: …" line falls back to the next recital whenever no shipped item is ahead, so it is never empty.

### 4.2 Season Two (51–100), content only

Same flow, same strip, recitals every 5. Every item is a palette swap, a gradient swap, or a data pattern, each 10–40 minutes of work. Season Two tiles are hidden until N_max ≥ 50 (a `season` field on catalog items), then appear in fixed order after the Season One tiles. Programs 11–20 have themes too, so posters and the second path of the Season map derive exactly like Season One: 11 Dawn, 12 Lantern, 13 Meadow, 14 Harvest, 15 Frost, 16 Comet, 17 Ember, 18 Blossom, 19 Velvet, 20 Encore. Theme colours for all twenty live in the catalog beside the names.

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

After 100: recitals, posters and the Season map continue forever with no new assets, and the "Next:" line keeps naming the next recital. Season Three is whatever Jose adds to the catalog.

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

**Music** tiles show the loop name and one tempo word: Music Box gentle, Harp Song slow, Candy Waltz lively, Silver Bells gentle, Rain Piano slow, Puddle Hop bouncy, Ocean Waves slow, Ballroom Waltz lively, Carnival Parade lively; Quiet shows a closed music-box lid. One preview plays at a time: a new music tile tap ramps the running preview out over 300 ms before the new one starts, and previews obey the `music` setting. **Sparkle style** tiles show one particle of the style; None shows an empty tile.

**How it evolves.** Rows fill on the fixed schedule above. Locked tiles are visible from day one in their fixed slot; the workout number appears only once that item has shipped (`shipped: true` in the catalog). After each performed recital the stage carries a new permanent decoration regardless of which stage she picks. Ambient sparkle count grows with Programs completed.

**Sensory notes.** No sound on entry; only tap-initiated ticks and previews. New tiles appear in a pre-drawn slot; nothing reorders. One row per screen keeps one decision per screen; the default path is one tap. No decoration or weather animates on this screen; only Pirouette's `lite-sway` and her tap Twirl move.

### 5.2 Make a dance (choreographer) — presets from workout 1, editor from workout 7

**How it works.** Inside step 2 (§3.7). Tapping "New dance" (or "Change" on a saved dance) opens the **editor**: one fixed instruction line, "Tap a move. It goes in the next empty slot."; the move strip of empty rounded slots; below it a fixed 2×4 **move palette** (a third row of two slots, hidden until N_max ≥ 50, holds the Season Two moves), big tiles (72 px, icon + one word), locked ones dimmed, with their number once shipped. Tap a move → it fills the next empty slot, Pirouette previews it once at normal speed, and its note plays. Tap a filled slot → it empties and later slots shift left. "Undo" removes the last move. When the slots are full, a palette tap makes the strip glow once (`lite-pop`) and plays no note, so the tap still does something. "Next: Name the dance" opens the naming screen (Jose: word tiles first): two rows of word tiles (Moon · Star · Cloud · River · Rose · Sunny / Waltz · Ballet · Ribbon · Dream · Song · Steps; none of these words is a move, preset, loop, item or theme name), one tap from each row makes the name ("Moon Waltz"), a second tap in the same row swaps the word, tapping the chosen word clears it, and the name-so-far sits above the tiles. The naming screen's "Save" button (h-16) is the only button called Save and is enabled from the start: two words save "Moon Waltz", one word saves that word alone, no words save "Dance K" (K = count of all her saved dances, including put-away ones, + 1, so names never repeat). A name that is already taken gets " 2", " 3", … appended. The keyboard is never required. Jose confirms the twelve words with her (§10). Leaving the editor with unsaved moves asks once: "Save this dance?" [Save] [Don't save]. A one-move dance is valid. "Next: Dance" plays it.

**Pirouette's choice** is a virtual dance, never a row: every unlocked move once, in catalog order, up to the length limit. It grows on move days, which the ending card announces ("New today: Sauté, a new move. Pirouette's choice has Sauté now."), and it is always the first tile, so she never has to have made a dance. What it contained on any evening is snapshotted on that evening's row (§8), so posters never change afterwards.

**Moves** (pentatonic notes so every dance is a consonant tune; beats at the loop's tempo; display names are per-move strings so Jose can swap the ballet words, §10):

| Move | Key | N | Beats | Note | Motion (keyframes under `.pir[data-move="key"]`) | Calm pose (reference only; not built, see §7) |
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

### 5.3 The Dance with Sparkle catch (rhythm) — dance from workout 1; Sparkle catch on from the first evening, second lane from 34

**How it works.** Step 3 (§3.8). One beat clock drives everything: `AudioContext.currentTime` when music is on, a `setTimeout` clock at the same tempo when music is off or Quiet is chosen. Moves advance on the clock; the move strip highlights the current move.

Sparkle catch is a **layer, not a mode**. Jose's decision: it is **on from the first evening** (`sparkle_taps`, default on; the preference stays so he can switch it off), and he shows her once before her first stage visit. When on, the Dance screen carries the fixed line "Tap when the sparkle reaches Pirouette. You can also just watch." for the whole dance. One sparkle per move drifts from the top-left wing along a fixed soft arc to the centre of the still ring at her chest over two beats, so it arrives at the same spot whatever her arms are doing. A faint gold ring around her is static until her first catch ever, and pulses on the beat from then on, so the only new motion on the first evening is the sparkle itself. A tap anywhere on the stage while the sparkle is inside the ring (±400 ms of arrival) → a 6-particle burst and a soft bell. A tap at any other time → one small silent sparkle at the fingertip. A sparkle not caught passes behind her and fades. Caught sparkles accumulate as a soft radial glow on the stage floor (opacity 0.1 + 0.04 per catch, max 0.6) and persist through the Bow; `recordCatches(n)` adds them to `sparkles_caught` once at the Bow, including after Stop and after "Dance again". No number appears unless Jose turns on `sparkle_count`. **The dance plays identically whether or not she taps**: ignoring the sparkles is simply the dress rehearsal.

**How it evolves.** The lane is there from her first dance. At workout 34 a second lane from the right unlocks ("New today: sparkles from both sides"), so two sparkles per move arrive on alternating beats. Sparkle style follows the Get ready choice. With the None sparkle style the ambient sparkles are off but the Sparkle catch sparkle stays, in gold, because the game is its own setting (`sparkle_taps`), not a style. Recitals run the layer across all their dances.

**Sensory notes.** Tempo 56–84 bpm, at most one sparkle every two beats per lane, generous window, no miss feedback, no score. The lane takes 1–2 of the screen's 12-element motion budget (§7); nothing faster than ~600 px/s, no flashes, no screen shake. The catch bell is the move's note one octave up only when that is C6 or lower; otherwise it is the same note with a 0.25 s decay, so nothing shrill ever plays. `sparkle_taps=false` removes the lane, the ring and the instruction line entirely. In calm mode the sparkle appears statically at the ring for its window; a tap swaps in a static burst.

### 5.4 Recital — every fifth workout, or the next stage visit after it

**How it works.** On recital day the strip's third step is the gold star "Recital" (§3.5); otherwise the strip is unchanged. Get ready works as always; the look is written on today's row. On an on-time recital day Choose a dance shows "Today's dances": the **distinct** dances recorded on the Program's four rehearsal rows (positions 1–4 of Program P, by ordinal; duplicates collapsed by their `moves` snapshot, so 1–4 dances; a position with no row or no snapshot plays Pirouette's choice as it is today). Dance's button reads "Start the recital". `startDance` sets `recital_program = P` and `danced_at` in the same update, so the recital counts as performed only when it has started. The recital has a fixed shape regardless of content, so even one distinct dance is a recognisably bigger show. Title cards last two beats on the beat clock (about 1.5–2 s) and are not skippable, so the music never stops between dances: a static title card "Recital 2", then each dance introduced by its own title card ("Dance 2 · Little Waltz"), then a title card "Finale" and the **finale**, every unlocked move once in catalog order, ending in the Bow with every earned cat clapping. The earned cats sit in the front-row box and are still during the dances; they sway and clap only during the Bow. Sparkle catch runs if on. The Bow card reads "Recital 2 complete.", shows the poster, and "New on the stage: string lights". Stop is always available and still completes the recital (the row was written at "Start the recital"). On a day when an older recital is ready (§4), Choose a dance is the normal screen with "Recital 1 is ready. It plays first.", and Dance plays the recital, then a title card "Now your dance · Little Waltz", then her dance; her dance is the row's snapshot, so the next Program's poster is right.

**Length.** A 6-slot dance at 66 bpm is about 15 s; four distinct dances with title cards are about 70–90 s, plus a finale of about 15 s at four moves. At 12 slots and 56 bpm a dance is about 35 s, so a four-dance recital reaches about 2.5 minutes before a finale of about 30 s; with duplicates collapsed it is usually shorter.

**Poster** (3:4 SVG, derived): the Program's theme colour, Pirouette in the look of the row that performed the recital (for a skipped recital, the look of the Program's last rehearsal row), "Program 2" with the theme name as a subtitle, and one row of move icons per distinct dance from the snapshots. Saved nowhere; rendered from `rehearsals` on the Season map.

**How it evolves.** Longer dances, more costumes and stages, more cats, stacking decorations. Recital 10 is the Season Finale with fireworks and the Season One poster (all ten posters in a grid). Recitals continue every 5 forever.

**Sensory notes.** Announced days ahead by the star on Today's Program line. No applause audio; cats clap visually, one slow chord ends it. Petals, confetti and fireworks are capped at 20 particles, do not play in calm mode, and can be turned off with `bow_showers`.

## 6. Achievements and unlockables

Rosettes hang on the curtain tie-backs and appear on the Season map. All are derived; none is calendar-shaped; none reads a score; none can be lost. Unearned rosettes are never shown anywhere, so none of them reads as a nudge to change a look she likes. Names say what happened.

| Rosette | Trigger (derived from) | Reward |
|---|---|---|
| First dance | first `rehearsals` row with `danced_at` set | gold rosette; Bow line "Your first dance." |
| First recital | first row with `recital_program` set and `danced_at` set (whatever its number, since older recitals can be skipped) | gold rosette; Bow line "Your first recital." (posters are not rewards: every Program's poster derives on its own) |
| Made a dance | first saved non-preset dance (put away or not) | pink rosette; Bow line "You made a dance." |
| Caught a sparkle | first row with `sparkles_caught > 0` | rosette; Bow line "You caught a sparkle." |
| Three costumes | danced rows in 3 different costumes | rosette |
| Five stages | danced rows on 5 different stages | rosette |
| Ten dances | 10 saved non-preset dances, put-away ones included | rosette; "My dances" gets a second shelf line |
| 100 moves | 100 `movement_completions` on completed workouts | rosette |
| All ten cats | `computeEarnedCats(N).length === 10` | rosette; the audience row is full at every recital |
| All eight costumes | N_max ≥ 47 (all eight Season One costumes) | rosette; Pirouette wears a tiny gold rosette pin on the Today done card |
| Season One | `maxPerformed >= 10` (shown at that Bow) | Season One poster grid; fireworks bow |
| Season Two | `maxPerformed >= 20` (shown at that Bow) | Season Two poster; grand fireworks |

Unlockables by threshold are the catalog in §4.1 and §4.2. Unlocks derive from N_max, a persisted high-water mark bumped at Finish and never lowered, so reopening a workout never relocks a tile she wore yesterday. Programs and positions derive from N, so a reopened workout can shift today's position; that is accepted as rare (same as the cats) and nothing she chose or made is affected, because every evening's look and moves are snapshotted on its row.

## 7. Sparkle and sound

### Sparkle

Vocabulary: the existing 4-point gold star with `lite-sparkle` breathing, plus styles that change shape and colour only: Pink Hearts (#ec9fbd), Snowfall (white 6-point), Twinkles (gold + white 5-point), Colour Drops (one fixed soft colour per particle, no hue cycling), Blossoms (coral), Fireflies (gold, slow), and None.

Moments: ambient breathing around Pirouette during the dance (count = 6 + `floor(N/5)`, cap 12 before the motion budget, in "lots"; fixed 3 in "some"); a 4-particle `lite-float` puff at each move start; a 6-particle burst on a sparkle catch; the floor glow pool; the `lite-pop` of today's circle at Finish; bow showers from decorations (petals at 25, confetti at 45, fireworks at 50) capped at 20 particles over 3 s, no more than one new particle per 150 ms.

**Motion budget, one per screen, regardless of settings.** Outside the Dance step nothing moves except Pirouette's `lite-sway`, her tap Twirl and her one-shot move previews (the ending card, the editor): no weather, no floating notes, no audience sway, no breathing decorations. During the Dance step the stage component has a budget of **12 moving elements** besides Pirouette's own moves, allocated in this order: stage weather first (Snow Field flakes, at most 6), then Sparkle catch lanes (1 each), then ambient sparkles fill the rest (never fewer than 3). The orchestra pit's notes and the audience are static until the Bow, where notes float, cats sway and clap, and bow showers (within their own 20 cap) replace the ambient sparkles.

Hard limits regardless of settings: nothing flashes faster than 2 Hz, no white flashes, no screen shake, no parallax, nothing moves faster than ~600 px/s, scale never exceeds 1.15 except Pirouette's own moves, all easing ease-in-out, animate only `transform` and `opacity`, never animated SVG filters.

Calm mode (existing `data-reduced-motion` on `<html>`): Jose's decision is that Nessa does not need it, so it stays only as the existing kill switch for parents and testing. The calm block in `globals.css` still gains one attribute rule for the rig, `:root[data-reduced-motion] .pir[data-move] * { animation: none }` (matching the attribute form the existing block already uses), and every new class: `lite-bow`, `lite-curtain-open`, `lite-curtain-close`, `lite-sparkle-drift`, `lite-ring-pulse`, `lite-snowfall`, `lite-petals`, `lite-confetti`, `lite-fireworks`, `lite-notes-float`, `lite-glow`, so everything switches off cleanly. The per-move static poses in the move table are **not built**: in calm mode Pirouette stands in her front pose while the move strip advances, ambient sparkles become three static dots, curtains jump, crossfades are instant, and Sparkle catch is a static appear-and-tap. Build the poses only if that decision ever changes.

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

Music loops are 8-bar patterns of scheduled oscillators. Every `Song` requires `{ bpm, beatsPerBar }` because the beat clock, sparkle drift and move durations all need both: Music Box (66 bpm, 3/4, triangle + sine one octave up at 0.3, 5 ms attack, 0.8 s decay), Harp Song (60 bpm, 4/4, sine through a 2 kHz low-pass, 1.2 s decay), Candy Waltz (72 bpm, 3/4, bright triangle melody over a soft sine bass, playful), Silver Bells (72 bpm, 3/4, sine + partial at 2.76×, 1.5 s decay), Rain Piano (56 bpm, 4/4, sparse notes; the filtered-noise bed is later polish), Puddle Hop (80 bpm, 4/4, staccato sine melody with a bouncing bass, the fun one), Ocean Waves (60 bpm, 4/4, slow detuned pads), Ballroom Waltz (84 bpm, 3/4), Carnival Parade (84 bpm, 4/4, a bright march, low-gain square wave through the low-pass). Quiet is no song; the clock runs at 66 bpm. Jose: she does not startle at new sounds and enjoys a fair amount of fun and calming music, so the loops lean richer than a first draft would, and the 2 s tile preview stays. A `Song` may instead point at a small audio file (under 200 KB) with its bpm and meter, so recorded loops Jose picks are welcome; the beat clock and everything above work unchanged. Decide synth vs files after Phase 0 (§9).

Rules: no sound ever plays without a tap; every start and stop is a gain ramp of at least 300 ms (music in 1.5 s, out 1–2 s); no crowd or applause audio; chimes stay louder than music.

### Controls (preferences card on the Friends tab, in this order)

| Setting | Column | Default | Effect |
|---|---|---|---|
| Sounds | `sound` (exists) | on | all chimes and notes |
| Music | `music` | on | loops only (Quiet is also a tile in the flow) |
| Volume | `volume` | soft | master 0.25 soft / 0.5 medium, never higher |
| Sparkle amount | `sparkle_amount` | lots | lots = 6 + Programs (cap 12 before the motion budget) ambient; some = 3, no bursts beyond the catch burst |
| Sparkle catch | `sparkle_taps` | on | off removes the lane, the ring and the instruction line; second lane from 34 |
| Show caught sparkles | `sparkle_count` | off | on adds "You caught 12 sparkles." to the Bow card, no denominator |
| Bow showers | `bow_showers` | on | off removes petals, confetti and fireworks at the Bow |
| Calm mode | `reduced_motion` (exists) | off | every animation off; kept as a kill switch only (Jose: she does not need it) |

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
  add column sparkle_taps   boolean not null default true,   -- Jose: on from the first evening
  add column sparkle_count  boolean not null default false,
  add column bow_showers    boolean not null default true,
  add column high_water_n   int     not null default 0;   -- highest N ever reached; bumped at Finish, never lowered
```

Move keys: `plie, reach, twirl, arabesque, saute, curtsy, glide, grand_spin` (Season Two adds `wave_arms, final_pose`); display names are separate strings. Costume, stage, music and sparkle values are catalog keys plus `quiet` and `none`. `settings.ts` mirrors every default and never throws. `dances` and `rehearsals` go into `scripts/backup.mjs` in Phase 1a, the moment rows can exist.

Write rules: `setLook(partial)` upserts today's row and touches only the four look columns. `startDance(danceId | null)` writes `dance_id`, `dance_name` and `moves` (the dance's moves, or `pirouettesChoice(N_max)` at that moment; the latest dance of the evening is the record), sets `danced_at` only if it is null, and sets `recital_program = P` only when a recital plays and the column is null, all in one update. `recordCatches(n)` adds to `sparkles_caught`. Nothing ever clears `danced_at` or `recital_program`.

### Derived, no tables (`src/lib/dance-progress.ts`, pure, mirrors `collection.ts`)

- `N` = count of workouts with `completed_at` set. The cats use the same count, so cat days and stage days always line up (§4.1).
- `N_max = max(N, settings.high_water_n)`: unlocks, tile numbers, slot counts and rosette thresholds use N_max, so nothing ever relocks.
- `todayN = N + (todayComplete ? 0 : 1)`; the Program line, the "Next:" countdown and `isRecitalDay` on both tabs use todayN, so nothing displayed changes at Finish.
- `program = ceil(todayN/5)`, `position = (((todayN-1) % 5) + 5) % 5 + 1` (guarded; todayN is never 0), `isRecitalDay = position === 5`.
- `ordinal(workout)` = count of completed workouts with `performed_on <= its performed_on`; a row's Program = `ceil(ordinal/5)`, its position = `((ordinal-1) % 5) + 1`.
- `performedRecitals` = rows with `recital_program` and `danced_at` set; `maxPerformed` = their highest program (0 if none).
- `readyRecital` = the largest P with `5P <= N` and `P > maxPerformed`, or none; older unperformed recitals are skipped, never performed.
- `programDances(P)` = distinct `moves` snapshots of rows at positions 1–4 of Program P, in order; a missing position or null snapshot plays `pirouettesChoice(N_max)`.
- `decorations` = every decoration whose program `<= maxPerformed` (plus Season Two gold upgrades the same way). Decorations are never part of `newlyUnlocked`.
- `unlocked(N_max)`, `nextUnlock(todayN)` (shipped items only, Season Two only when N_max ≥ 50, falling back to the next recital), `newlyUnlocked(from, to)` (shipped wardrobe, move and length items only), `slotCount(N_max)`, `ambientSparkles(N, amount, weather, lanes)` = min(6 + `floor(N/5)`, 12 − weather − lanes), never below 3 ("some" = 3), from the catalog in `src/lib/dance-content.ts`, where every item is `{ key, name, kind, unlockAt, season, shipped, ... }` and `unlockAt` is data that never changes once displayed.
- `pirouettesChoice(N_max)` = unlocked moves in catalog order, truncated to `slotCount(N_max)`.
- Audience = `computeEarnedCats(N)`.
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

**Phase 0 · iPad spike (half a session). Built; it lives at `/spike`, off the bottom nav, needs no database.** Pirouette rig with the four base moves and Bow; rotateY on the root; `transform-box` origins; `--beat` durations and the reflow restart on the wrapper; the Music Box loop and one 84 bpm loop (Carnival Parade) through the shared AudioContext resumed on tap; the Big spin keyframe (1080° on the root) so both spins are checked at the fastest tempo and the brightest timbre is heard; stop on `visibilitychange`. Test on the real iPad before anything else. Decide synth vs small audio files here.

**Phase 1 · Stage foundation (2–3 sessions total, shipped in two parts). The Twirl button stays live until 1a is ready; there is no "before her next workout" deadline. The stage counts every completed workout, the same as the cats, so if she has finished workouts before 1a ships her first stage visit lists what those earned under "New since last time"; handing her the app only once 1a is live keeps that first visit to exactly one new thing (Jose's call, §10 #16). The nightly backup schedule is on from now (Jose wants backups); the workflow skips cleanly while the repository secrets are missing.**

*1a (ship first, replaces the Twirl button):* `migration-0001`; full catalog and progress lib with every `unlockAt`, `shipped` and `season`; `music.ts` with Music Box and Harp Song (Harp Song unlocks at 2, inside 1a's lifetime); `ScheduleStrip` extracted and reused; Today's ending card, slipper states, done state and nav dot; Get ready with Costume, Stage and Music rows (Classic + Swan, Practice Room + Moon Night, Quiet + Music Box + Harp Song; locked tiles with numbers only for shipped items; "New today" and "New since last time" banner lines; tap-to-Twirl); Choose a dance as the fixed 2×2 tile grid (Pirouette's choice, two presets, "New dance" dimmed without a number); Dance with four moves, curtains, ambient sparkles within the budget, move strip, Stop, and the Sparkle catch lane (drifting sparkle, still ring, ±400 ms window, burst and capped bell, fingertip sparkle, the instruction line, `sparkle_taps` default on); Bow with final chord, "Done for today" (persisted `stage_closed_at`, "The stage is closed for today.", "Open the curtains") and "Dance again"; `dances` and `rehearsals` in `backup.mjs`; calm block updated.

*1b (before her 5th workout):* Program line and "Next:" line; the recital-day star on both strips; Recital (fixed shape with title cards and finale, "Recital N complete.", ready-until-performed, newest only, recital-then-her-dance on a late day); decorations footlights and string lights; cat audience at the Bow; Sparkle style row (Gold + None); the Season map on the Friends tab with all ten theme names and the current Program ringed (a performed Program's slot shows the gold star until posters arrive in Phase 2, and the Bow card omits the poster until then); preferences Music, Volume, Sparkle amount, Sparkle catch, Bow showers.

Out of Phase 1: editor, Sauté, posters, rosettes, Sparkle catch polish (Phase 3), everything unlocking after 10.

**Phase 2 · Choreographer, posters and rosettes (1–2 sessions). Ship before her 7th workout; if late, the "New dance" tile simply stays promise-free (no number) and the "Next:" line skips it. Built 23 Oct 2026.**
In: editor (instruction line, palette, slots, one-tap undo, full-palette glow, the naming screen with two rows of word tiles and Save enabled from the start, "Save this dance?" on leaving, put away with "Put it back"); "My dances" row; posters and rosettes on the Season map shipped in 1b (Program 1's poster appears retroactively because it is derived); content through workout 15 (Sauté, Candy Waltz, Sugar Plum, 8 moves, garlands).

*As built (details the sections above left open):* the editor's day reads "New today: New dance. You can make your own dances now." on the ending card and the banner (a feature is today's one new thing, though "New since last time" still lists only wardrobe, move and length items, §8); length items read "longer dances, 8 moves" everywhere ("Next: longer dances, 8 moves in 2 workouts"); a put-away dance stays listed under My dances as "Moon Waltz is put away." with its "Put it back" link; "Save this dance?" → Save keeps the words chosen so far (none → "Dance K"); Change keeps the name unless she taps new words; a poster's missing snapshot is Pirouette's choice as it was at the Program's end (workout 5P), so a poster never changes; "All ten cats" counts from N_max and "All eight costumes" also waits until all eight have shipped, so neither can be lost or promised early; "Caught a sparkle" can only be earned once Phase 3 persists `sparkles_caught`; rosettes on the curtain tie-backs are frozen when the stage opens, like the decorations, and one earned tonight hangs from the Bow on, where its line announces it.

**Phase 3 · Sparkle catch polish (half a session). The lane itself ships in 1a so "on from the first evening" is literally true; this adds what it leaves behind.**
In: the ring pulsing on the beat after her first catch, the floor glow, `sparkles_caught` persisted at the Bow (including after Stop and "Dance again"), the "Caught a sparkle" rosette, the `sparkle_count` setting. The second lane ships later as the catalog item at 34 (Phase 4).

**Phase 4 · Content drops (ongoing, 20–40 minutes per item, each shipped before its unlock day or left promise-free until it is).**
Remaining costumes, stages, music loops, sparkle styles, moves (Curtsy, Glide, Big spin), 10 and 12 moves per dance, decorations 20–50, the second Sparkle catch lane at 34, Season One poster and fireworks. No logic changes except the second lane: catalog rows with `shipped: true`, overlay paths, note patterns, and selectors in the calm block.

**Phase 5 · Season Two and tuning (months out, half a session per Program).**
Colourways, stage variants, two loops, two moves, gold decorations, Crown at 97; whatever watching her play suggests (window width, default sparkle amount, which pickers she skips).

**Rule for every phase:** a number she has seen never changes. `unlockAt` is data; an item whose code has not shipped carries no number and is skipped by "Next:", and when the day arrives without it, nothing is announced and nothing is relabeled. An unlock day never arrives with a promise it cannot keep.

## 10. Decisions (Jose, 22 October 2026)

The twenty open questions were answered on 22 October 2026, and every section above already reflects the answers. If one changes, change this document first, then the code.

| # | Question | Decision | Where it lands |
|---|---|---|---|
| 1 | Words | Keep the ballet vocabulary: rehearsal, recital, Program, Get ready, Choose a dance. She takes ballet. | strings everywhere |
| 2 | Session vs menu | One fixed session. The stage stays locked until today's workout is finished and says so in one sentence. The mini-game must always read as a chapter of the longer story. | §2, §3.0, §4 (Story, Season map) |
| 3 | Program length | Five workouts. | §4 |
| 4 | Numbers | None shown. `sparkle_count` stays off. | §7 |
| 5 | Locked tiles | Visible in place, with the workout number once the item has shipped. | §3.6, §5.1 |
| 6 | Get ready layout | One row per screen. | §3.6 |
| 7 | Dance names | Word tiles first; "Dance K" when she skips them. The twelve words are Moon · Star · Cloud · River · Rose · Sunny / Waltz · Ballet · Ribbon · Dream · Song · Steps. Jose confirmed the list on 22 Oct 2026 with Garden and Snow; those two were then swapped for Cloud and River because Garden and Snow are Program theme names (to confirm). | §5.2 |
| 8 | After "Done for today" | "Open the curtains" stays for free play. | §3.10 |
| 9 | Rest days | The stage stays closed; nothing is watchable without a finished workout. | §3.0, §3.11 |
| 10 | Recital length | The full recital, finale and bow showers included. | §5.4 |
| 11 | Music | She does not startle at new sounds and enjoys a fair amount of fun and calming music. Nine Season One loops; the 2 s tile preview stays; synth versus recorded loops is decided in Phase 0 by listening on the iPad. | §4.1, §7 |
| 12 | Sparkle | "lots". Check the 720° and 1080° spins with her on the device in Phase 0. | §7 |
| 13 | Calm mode | Not needed for her. Kept only as a kill switch; the per-move static poses are not built. | §7 |
| 14 | Darker backdrops | Keep them. | §5.1 |
| 15 | Program line on Today | Keep both rows. | §3.0 |
| 16 | Starting count | **Amended after the consistency review; Jose confirmed 22 Oct 2026.** Counting the stage from a start date while the cats count everything would put cats and unlocks on the same days, breaking "one new thing per workout". So the stage counts every completed workout, exactly like the cats, and `stage_start_on` is gone. To keep her first stage visit to one new thing, hand her the app once Phase 1a is live; if she has finished workouts before then, her first visit lists what they earned under "New since last time". | §2, §4.1, §8, §9 |
| 17 | Recital day | Marked big: the Dance step becomes a larger gold star labelled "Recital" on both strips, and Today reads "Recital 1 today." | §2, §3.0, §3.5, §3.7, §5.4 |
| 18 | Backups | Wanted. The nightly schedule is on; the job skips cleanly until the repository secrets exist. `dances` and `rehearsals` join the backup table list in Phase 1a. | §9, `.github/workflows/backup.yml` |
| 19 | Sparkle catch | On from the first evening (`sparkle_taps` default true), so the lane ships in Phase 1a. Jose shows her once. The ring stays still until her first catch. The second lane unlocks at 34 as an announced item. | §4.1, §5.3, §7, §8, §9 |
| 20 | Move names | Keep Plié, Arabesque, Sauté, Curtsy and the rest. | §5.2 |

Still to confirm, with her, on the real iPad during Phase 0: whether the big spins (12) are comfortable to watch, and whether the four step names (1) are the words she would use.

Also to confirm with Jose: each Done on Today still shows lift-lite’s small flexing-cat toast. §3.2 asks for a plain workout (chime, check, dot), but this is the lift-lite reward she already loves, so it stays until he says otherwise.

Added after the consistency review and confirmed by Jose the same day (22 October 2026): the amendment to #16 above; the twelve naming words in #7 (Garden and Snow swapped afterwards for Cloud and River, see #7); four Program themes sharing a name with one item in their own Program (Sugar Plum, Starlight, Grand Theater, Rainbow), kept with the kind-word rule rather than renamed; and the Season Two theme names Dawn, Lantern, Meadow, Harvest, Frost, Comet, Ember, Blossom, Velvet, Encore.
