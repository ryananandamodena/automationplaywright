# GCCS Master Grading — Test Case & Findings Summary

Environment: `https://gccs-test.modena.com` | User: `FE_GCCS` / System Admin
Scope: Login, Grade Categories, Questions Setup, Item Grading
Method: Live exploration via Playwright (screenshots + DOM inspection) on 2026-08-04.

## 1. Application Overview (observed)

- Stack: React SPA (PrimeReact components), REST-backed, no visible GraphQL.
- All 3 modules follow the same shell: search box, "Filter Data (n)" button, "Add New" button, paginated table with Action (Edit/Delete icons), toast notifications on save.
- **Grade Categories**: flat CRUD table (Grade, Min Score, Max Score, Description). Modal form: `#grade`, `min_score`, `max_score`, `#description`.
- **Questions Setup**: flat CRUD table (Question, Checklist Only, Is Default, Points Yes, Points No) + a "Total Default Points / 100 PTS" widget and a banner explaining the **Automated Assignment Rule**: default questions auto-apply to all items unless explicitly overridden in Item Grading. Modal form: `#question`, `#checklist_only` (switch), `#is_default` (switch), `point_yes`, `point_no`.
- **Item Grading**: relational module — links a **Product Item** (searchable react-select) to a set of **Evaluation Questions** (dynamic slots, each a dropdown populated from Questions Setup, pre-filled with default questions per the automation rule above), with a running points total (max 100) and a Status toggle. This is a full page (`/item-grading/create`), not a modal.

## 2. Data / Business Rule Confirmations

| Rule | Observed | Verdict |
|---|---|---|
| Default questions auto-attach to new Item Grading | `question default` + `question 2` (both `Is Default = Yes`) pre-populated in Add form | ✅ Confirmed |
| Points total capped hint at 100 | "Total: 10 / 100 Pts" shown live while adding slots | ✅ Confirmed |
| Grade category name required | Submitting blank shows "Category name is required" | ✅ Confirmed |
| Whitespace-only name treated as empty | `"   "` triggers the same required-field message (trimmed server/client-side) | ✅ Confirmed |
| All create/update submits go through a 2nd "Are you sure...?" confirm step | Modal shows `Are you sure you want to create category "X"?` with Back/Yes, Confirm before the actual save fires | ✅ Confirmed |
| Duplicate grade name rejected server-side | Re-creating grade "A" → toast "Failed to create category. Category name already exists" | ✅ Confirmed |
| Max score must be ≥ min score, validated client-side | min=90/max=10 shows inline "Max score must be ≥ min score", blocks submit before the confirm dialog | ✅ Confirmed |

## 3. Bug / Risk Findings

| ID | Severity | Title | Evidence | Recommendation |
|---|---|---|---|---|
| BUG-QS-01 | Medium | Duplicate question text ("question 3") exists twice in Questions Setup with different flags (Checklist Only Yes/No) | Screenshot `questions-setup.png`, row 3 & 4 both show "question 3" | Add uniqueness validation on question text, or rename to disambiguate if intentional (e.g. different item scope) |
| RISK-IG-01 | Low | Product Item field is a client-side searchable select with no visible pagination/lazy-load indicator for large catalogs | Not stress-tested (test env has few products) | Confirm server-side search/pagination for production-scale product catalog |
| OBS-01 | Info | Every create/update action requires an extra "Are you sure?" confirmation step (Back / Yes, Confirm) beyond the form submit | Observed on Grade Categories create; likely applies to Questions Setup and Item Grading too | Intentional friction reduces mis-clicks but adds a step to every automated and manual flow — confirm this is deliberate UX, not an accidental double-submit guard leaking into the UI |

## 4. Condensed Test Case Table

| Test ID | Module | Scenario | Preconditions | Steps | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|---|---|
| TC-LOGIN-001 | Login | Valid login | Logged out | Fill user/pass, submit | FE_GCCS / P@ssw0rd.1 | Redirect to /dashboard | Critical |
| TC-LOGIN-002 | Login | Invalid username | Logged out | Fill bogus user | random / P@ssw0rd.1 | Stays on login, error shown | High |
| TC-LOGIN-003 | Login | Invalid password | Logged out | Fill wrong pass | FE_GCCS / wrong | Stays on login, error shown | High |
| TC-LOGIN-004 | Login | Empty fields | Logged out | Submit blank form | "" / "" | Client validation blocks submit | High |
| TC-LOGIN-005 | Login | SQLi in credentials | Logged out | `' OR 1=1 --` | n/a | Auth rejected, no bypass | Critical |
| TC-LOGIN-006 | Login | Direct URL without session | No cookies | Navigate to protected route | n/a | Redirect to login | Critical |
| TC-LOGIN-007 | Login | Back button after logout | Logged in then out | Logout, browser back | n/a | Not authenticated, no protected data shown | High |
| TC-GC-001 | Grade Categories | Create valid | Logged in | Add New → fill → submit | grade=`AUTO-xxx`, 10–50 | Toast success, row appears | Critical |
| TC-GC-002 | Grade Categories | Create empty | Logged in | Submit blank | "" | "Category name is required" | High |
| TC-GC-003 | Grade Categories | Whitespace name | Logged in | Fill " " | " " | Same as empty (trimmed) | Medium |
| TC-GC-004 | Grade Categories | Duplicate grade | Grade "A" exists | Re-add "A" | A / 0-100 | Rejected with duplicate error | High |
| TC-GC-005 | Grade Categories | min > max | Logged in | min=90,max=10 | 90/10 | Rejected, range error | Medium |
| TC-GC-006 | Grade Categories | XSS payload | Logged in | Fill `<script>` in desc | payload | Escaped, no alert fires | Critical |
| TC-GC-007 | Grade Categories | Very long input | Logged in | 300+ char grade | long string | Rejected or safely truncated, no crash | Medium |
| TC-GC-008 | Grade Categories | Search match | Data exists | Search "Disposal" | "Disposal" | Row filtered correctly | Medium |
| TC-GC-009 | Grade Categories | Search no match | Data exists | Search garbage | "ZZZ..." | Empty state shown | Low |
| TC-GC-010 | Grade Categories | Cancel create | Logged in | Fill then Cancel | any | No new row persisted | Medium |
| TC-GC-011 | Grade Categories | Edit persists | Row exists | Edit description, save | new desc | Toast success, updated value shown | High |
| TC-GC-012 | Grade Categories | Delete confirmed | Row exists | Delete → confirm | n/a | Row removed, toast success | Critical |
| TC-GC-013 | Grade Categories | Delete cancelled | Row exists | Delete → cancel | n/a | Row remains | Medium |
| TC-QS-001 | Questions Setup | Create valid | Logged in | Add New → fill → submit | question text, pts | Toast success, row appears | Critical |
| TC-QS-002 | Questions Setup | Empty required | Logged in | Submit blank | "" | Required-field error | High |
| TC-QS-003 | Questions Setup | Checklist-only ⇒ 0 pts | Logged in | Toggle Checklist Only | any | Points forced/shown as 0 | Medium |
| TC-QS-004 | Questions Setup | Script injection | Logged in | Fill `<script>` in question | payload | Escaped, no alert | Critical |
| TC-QS-005 | Questions Setup | Search | Data exists | Search "question default" | text | Row filtered | Low |
| TC-QS-006 | Questions Setup | Total points widget | Logged in | Open page | n/a | "X / 100 PTS" visible & correct sum | Medium |
| TC-QS-007 | Questions Setup | Duplicate "question 3" regression guard | Logged in | Count rows matching text | "question 3" | Flags BUG-QS-01 until fixed | High |
| TC-IG-001 | Item Grading | Defaults auto-applied | Logged in | Open Add page | n/a | Default questions pre-filled per rule | Critical |
| TC-IG-002 | Item Grading | Save without product | Logged in | Save immediately | n/a | Blocked, "select a product" error | High |
| TC-IG-003 | Item Grading | Remove all slots | Logged in | Remove both default slots, save | n/a | Blocked, "at least one question required" | High |
| TC-IG-004 | Item Grading | List columns present | Logged in | Open list | n/a | Product/Total Questions/Status columns visible | Low |
| TC-IG-005 | Item Grading | Search | Data exists | Search "MODENA AC SPLIT" | text | Row filtered | Low |
| TC-IG-006 | Item Grading | Integration: question count reflected | Data exists | Read Total Questions cell | n/a | Matches configured slot count (3) | High |

## 5. Checklists (condensed)

**Smoke:** login, open each of the 3 pages, create 1 record per module, verify it appears.
**Regression:** all CRUD flows above + search/filter/pagination on each module.
**Security:** SQLi/XSS on login and all free-text fields (grade name, description, question text, remarks); direct URL access without session; verify no secrets in cookies/localStorage.
**Performance (manual timing while running suite):** login < 2s, page open < 2s, create/edit/delete round-trip < 3s — flag anything over 5s.

## 6. Notes on Scope

This is the condensed deliverable (per agreed scope). Not included in detail: full 20-section report (BVA/EP tables per field, per-bug screenshots, exhaustive accessibility/UX audit). The automation suite in `tests/` is the primary executable artifact — extend `utils/testData.ts` to add more BVA/EP cases as needed.
