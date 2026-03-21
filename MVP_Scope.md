---

name: lindholmen-lunch-matching-mvp
overview: Design and implement a Lindholmen-focused lunch-matching web app MVP that forms temporary lunch groups based on time windows, interests, cuisine, group size, and restaurant opening hours, with strong privacy and no public profiles.
todos:

- id: define-data-model
content: Define concrete TypeScript/DB models for Restaurant, LunchRequest, and LunchGroup based on the conceptual design.
status: pending
- id: design-matching-engine
content: Design concrete functions for time overlap, interestScore, cuisineScore, groupSizeScore, and group formation using the specified weights and constraints.
status: pending
- id: design-ui-screens
content: Design the two core screens (Today’s lunch preferences and Matching status/results) as responsive web UI, including form layout and result presentation.
status: pending
- id: seed-restaurant-data
content: Prepare an initial manual list of Lindholmen restaurants with coordinates, cuisine, and lunch opening hours.
status: pending
isProject: false

---

### Lindholmen Lunch Matching MVP Plan

### 1. Background & Goal

- **Problem**: People on Lindholmen (Gothenburg) often eat lunch alone or want to meet new people, but it is socially awkward or time-consuming to find lunch company.
- **Goal**: Build a “here and now” lunch-matching app that creates temporary lunch groups based on:
  - time window availability
  - topics/interests to talk about
  - preferred cuisine
  - preferred group size
  - restaurant opening hours
- **MVP constraint**: Scope is limited to Lindholmen.

### 2. Core Principles

- **No public profiles**
  - No profile pages, no searching for specific people, no visible history of who lunched with whom.
- **Session-based behavior**
  - Users submit a `LunchRequest` for today’s lunch only.
  - The system matches multiple `LunchRequest`s into concrete `LunchGroup`s.
- **Low friction, high privacy**
  - Minimal personal data (first name or alias only, visible only inside a matched group).
  - Matching focuses on time, interests, cuisine, and group size, not identity.

### 3. Key User Stories

- **Mattias**: wants company so he does not eat alone; topic is not important.
- **Wictor**: wants to talk about football (possibly a specific team) and ideally build a new friendship.
- **Eva**: is travelling, knows no one locally, and wants to lunch with people in her tech field.

These stories drive requirements for:

- reliable time matching
- interest/topic matching
- cuisine preferences
- group size control

### 4. High-Level User Flow (MVP)

- **Scenario**: "I want to have lunch today on Lindholmen"
  1. User opens the app.
  2. On the main screen, user configures **today’s lunch preferences**:
    - time window (e.g. 11:30–14:00)
    - up to 5 ranked interests (positions 1–5)
    - up to 5 ranked cuisines (positions 1–5)
    - desired group size interval (e.g. 2–4 people)
    - optional weighting choices for this request:
      - ignore cuisine (focus on interests + group size)
      - ignore interests (focus on cuisine + group size)
  3. User submits a `LunchRequest`.
  4. System:
    - collects all active `LunchRequest`s for Lindholmen (for a given day)
    - runs the matching engine
    - forms and proposes one or more `LunchGroup`s with:
      - a concrete time (within each participant’s window, with ≥ 50 min overlap)
      - a restaurant on Lindholmen that is open at that time
      - the group’s participants (first name/alias only)
  5. User can:
    - confirm participation in the suggested `LunchGroup`
    - (later versions may support declining and waiting for a new match)

### 5. Conceptual Data Model

- **Restaurant**
  - `id`
  - `name`
  - `latitude`, `longitude`
  - `cuisine` (e.g. `"indian"`, `"thai"`, `"swedish"`)
  - `openingHours` per weekday
    - at minimum, one or more lunch intervals, e.g. 11:00–14:30
- **LunchRequest** (per user, per lunch occasion)
  - `userId` (internal only)
  - `displayName` / alias (visible to group members)
  - `timeStart`, `timeEnd`
  - `interests[]` (up to 5 ordered strings, ranks 1–5)
  - `cuisines[]` (up to 5 ordered strings, ranks 1–5)
  - `minGroupSize`, `maxGroupSize`
  - `weightInterest` (e.g. 0 or 3)
  - `weightCuisine` (e.g. 0 or 2)
  - `weightGroupSize` (e.g. 1)
  - `date` and `area` (e.g. `Lindholmen`)
- **LunchGroup** (result of matching)
  - `id`
  - `restaurantId`
  - `timeStart`, `timeEnd` (selected time slot within participants’ overlap)
  - `participantUserIds[]`
  - optional `matchScore` (for ranking/debugging)

### 6. Matching Engine Design

- **Hard constraints**
  - **Time overlap**: two users can only be matched if the intersection of their time windows is at least **50 minutes**.
  - **Restaurant opening hours**: the final group time slot must lie within the chosen restaurant’s opening hours for that day.
- **Ranking weights per rank position (1–5)**
  - Used for both interests and cuisines:
    - rank 1 → 10 points
    - rank 2 → 7 points
    - rank 3 → 5 points
    - rank 4 → 3 points
    - rank 5 → 2 points
- **Pairwise scores**
  - `interestScore(A,B)`:
    - for each shared interest, add `weight(rank in A) + weight(rank in B)`
    - sum over all shared interests.
  - `cuisineScore(A,B)`:
    - same as above but for cuisines.
  - `groupSizeScore(A,B)`:
    - compute overlap between `[minGroupSize, maxGroupSize]` for A and B
    - if no overlap → 0
    - else score is proportional to overlap width (e.g. number of overlapping group sizes).
- **Per-request weights for aspects**
  - Each `LunchRequest` specifies numeric weights:
    - `weightInterest`
    - `weightCuisine`
    - `weightGroupSize`
  - Examples:
    - "Today I do not care about cuisine" → `weightCuisine = 0`.
    - "Today I only care about cuisine" → `weightInterest = 0`.
- **Total pair score**
  - If time overlap < 50 minutes → `score = 0`.
  - Otherwise:
    - `score(A,B) = W_I * interestScore(A,B) + W_C * cuisineScore(A,B) + W_G * groupSizeScore(A,B)`
    - `(W_I, W_C, W_G)` can be derived from A and B’s individual weights (e.g. average or minimum), as long as the rule is consistent.
- **Group formation heuristic**
  - Compute pairwise scores for all request pairs.
  - Sort pairs by decreasing score.
  - Greedy grouping:
    - start with the highest-scoring pair
    - try to add more users if they:
      - have ≥ 50 min overlap with the group’s current common time window
      - are compatible with everyone’s min/max group size constraints
      - maintain a reasonable average pair score with existing members
  - Discard candidate groups that violate any member’s min/max group size.
  - For each valid group, pick a restaurant:
    - prefer a restaurant whose cuisine matches the group’s dominant preferences
    - ensure the restaurant is open during the chosen time

### 7. Screens / Views (MVP Overview)

- **Screen 1: Today’s lunch preferences**
  - Inputs:
    - time window (start and end)
    - five interest slots (ordered 1–5)
    - five cuisine slots (ordered 1–5)
    - group size range (min–max)
    - toggles:
      - "Ignore interests today"
      - "Ignore cuisine today"
  - Primary action: "Submit lunch request".
- **Screen 2: Matching status and results**
  - Initial state:
    - simple message like "We’re finding the best lunch company for you on Lindholmen…".
  - Once a match is found:
    - show lunch time
    - restaurant name, cuisine, and location
    - participants’ first names/aliases
    - actions to confirm or decline participation
- Additional views (e.g. "About", "How it works") can be added later but are not core MVP.

### 8. MVP Scope & Exclusions

- **In scope**
  - Single area: Lindholmen.
  - Manually curated restaurant list with:
    - name, coordinates, cuisine, opening hours.
  - One-off `LunchRequest`s per day per user.
  - Automated matching into small groups using the matching engine above.
  - Simple confirmation flow for joining a proposed `LunchGroup`.
- **Out of scope (MVP)**
  - Chat/messaging.
  - Friend lists, follow system, or social graph.
  - Ratings, reviews, or reputation.
  - Public profiles or searchable users.
  - Multi-city support (anything beyond Lindholmen).

### **9. UI & Interaction Rules**

- **Screen 0: Welcome & Area**
  - Simple introduction explaining the app’s purpose (“find lunch company nearby, here and now”).
  - Area selection:
    - MVP: only one selectable area, `Lindholmen`.
  - Tapping Lindholmen navigates to the Today’s Lunch Request screen.
- **Screen 1: Today’s Lunch Request**
  - Inputs:
    - `displayName` / alias.
    - Time window (`timeStart`, `timeEnd`), with note that minimum required overlap is 50 minutes.
    - Group size range (`minGroupSize`, `maxGroupSize`).
    - Interests list: up to 5 ranked items (1–5), each with a per‑row “Use today” toggle.
    - Cuisines list: up to 5 ranked items (1–5), each with a per‑row “Use today” toggle.
  - Behavior:
    - Turning a row’s toggle off means that specific interest/cuisine does not contribute to matching.
    - It is allowed to turn **all** interest toggles off and/or all cuisine toggles off; in that case matching is based only on the remaining dimensions (time + group size and any still‑on rows).
  - Primary action: “Submit lunch request”, then navigate to the Queue screen.
- **Screen 2: Queue / In Progress**
  - Shows that the user is in the matching queue for today.
  - Copy example: “We’re finding your lunch group on Lindholmen… You’ll see your match 30 minutes before the suggested start time.”
  - Optional but recommended: a “Cancel request” action to withdraw from matching.
- **Screen 3: Match Proposal**
  - The system presents exactly **one** proposal at a time:
    - concrete time interval (e.g. 12:00–12:50),
    - chosen restaurant (name, cuisine, opening hours),
    - group composition (user + aliases of other participants).
  - Actions:
    - **Accept**: user confirms participation; group is considered fixed for that user.
    - **Decline (show next match)**:
      - the current proposal becomes permanently unavailable to this user (cannot be reinstated),
      - if another viable match exists, the next‑best match is shown as a new proposal.
  - There is never a screen that shows multiple simultaneous options; proposals are always presented sequentially to avoid “shopping” between groups.

### **10. UI Style Guidelines (MVP)**

- **Screen look & feel**
  - Mobile-first layout that works well on small screens but also scales to desktop.
  - Clean, minimal, light theme with high contrast and readable fonts.
  - Use simple cards for key information (restaurant, match summary, group details).
- **Actions and buttons**
  - Primary actions (e.g. “Submit lunch request”, “Accept”) should use a clear accent color.
  - Only one clear primary button per screen; secondary actions should be visually calmer/subtle.
- **General tone**
  - The interface should feel calm, safe, and straightforward.
  - Copy should be short and clear, lowering the social barrier to trying the app (“this is easy and low-pressure to try”).

