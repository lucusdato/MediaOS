# Activation Response to Blocking Chart: Mapping Specification

**Version:** 1.1
**Date:** March 6, 2026
**Purpose:** Define the rules for translating KSO activation response data into the standardized Initiative blocking chart template. This spec serves as the foundation for MediaOS automation.

---

## 1. Source Files and Tabs

### Social Activation Response
- **Primary tab:** The main media plan tab (e.g., `Media Plan`). This is always a single tab containing all social tactic data.
- **Source columns:** A (Measurement), B (Flight Dates), C (Platform), D (Objective), E (Campaign Details), F (Channel/Brand Say/Other Say), G (Ad Formats), H (KPI), I (Target), J (Budget), K (Est. Reach), L (Est. Impressions), M (Est. CPM), N (Est. Freq), O (KPI Volume)
- **EN/FR split:** Defined at top of tab (row 2-3) as percentage split. EN and FR sections are separated within the tab.

### Programmatic Activation Response
- **Tab structure varies by campaign.** Each DSP or buying platform may get its own tab. Common examples include tabs for TTD (TradeDesk), ADSP (Amazon DSP), DV360 (Google), or combinations like `KSO Media Plan_TTD+ADSP`. Larger campaigns may split these into separate tabs; smaller ones may combine them.
- **Identifying the right tabs:** Look for tabs with names containing "KSO Media Plan", "Media Plan", or DSP platform names (TTD, DV360, Amazon, ADSP). Ignore reference tabs like specs, targeting breakdowns, measurement options, and scheduling tabs.
- **Source columns (consistent across tabs):** B (Platform), C (Objective), D (Campaign Details), E (Target), F (Buy Type), G (Language/Geo), H (KPI), I (KPI Benchmark), J (Est. Viewability%), K (Start Date), L (End Date), M (Net Budget), N (Est. Impressions), O (Est. CPM)
- **Important:** All programmatic media plan tabs share the same column structure. The tool should parse every tab that matches the media plan pattern, not just a hardcoded list of tab names.

---

## 2. Blocking Chart Template Structure

### Header Area (Rows 3-11)
| Cell | Content | Formula |
|------|---------|---------|
| E3/F3 | Client / Unilever | Static |
| E4/F4 | Brand / [Brand Name] | Static |
| E5/F5 | Campaign / [Campaign Name] | Static |
| E6 | Prisma ID placeholder | Static |
| E7/F7 | Original/Revision Date | =TODAY() |
| E8/F8 | Flight Dates | Static text |
| E9/F9 | Planned Net Media | =AB[grand_total_row] |
| E10/F10 | Estimated Fees | =AA[grand_total_row] |
| E11/F11 | Total Gross Budget | =SUM(F9:F10) |

### Column Header Row (Row 14)
B through AB, fixed. Never modify.

### Data Area (Row 15+)
Organized into sections, each with:
1. Section header row (bold, dark fill, merged B:C, SUM formulas in R, U-AB)
2. Data rows (tactic-level detail)
3. Optional secondary target rows (only column P populated)

### Total Rows
Immediately after the last data section (no blank row):
- TOTAL LINEAR (references linear section header)
- TOTAL OUT OF HOME (references OOH section header)
- TOTAL PROGRAMMATIC VIDEO (references prog video section header)
- TOTAL CONNECTED TV (references CTV section header)
- TOTAL SOCIAL (references social section header)
- TOTAL (grand total, SUM of all channel totals)

---

## 3. Column Mapping Rules

### Blocking Chart Column B: Channel
**Source field:** Social = column F ("Channel" / Brand Say / Other Say); Programmatic = derived from media type

**Transformation rules:**
- "Brand Say" from activation + platform context = "Brand Say Social" (for social rows) or "Brand Say" (standalone)
- "Other Say" from activation = "Other Say Social" or "Other Say"
- If BLS multi-cell structure exists, append " - Cell A" or " - Cell B" to the channel name
- Single-cell BLS and non-eligible rows: standard naming without cell labels

### Blocking Chart Column C: Platform
**Source field:** Social = column C; Programmatic = column B
- Only populated on the FIRST row of a platform group. Subsequent rows for the same platform within a section leave C blank (merged visually).
- Platform values: TikTok, Meta, Pinterest, YouTube, TradeDesk, Amazon, Twitch

### Blocking Chart Column D: Media Type
- Social platforms: "Social"
- YouTube/Twitch/OLV: "Digital Video"
- CTV platforms (Amazon Prime Video, Netflix, Sportsnet, Fubo, TVA+, Radio Canada): "Connected TV"
- Linear: "Linear"
- OOH: "Experiential Out of Home"
- Only populated on the first row of a platform group within a section.

### Blocking Chart Column E: Buy Type
**Translation from activation responses:**
| Activation Term | Blocking Chart Value |
|----------------|---------------------|
| Auction | Auction |
| Reach & Frequency / Reach (Reserved) | Reach & Frequency |
| Programmatic Guaranteed (PG) via Investment Team | Managed Service |
| CPM (DV360) | Auction |
| PMP | PMP |
| Managed Service | Managed Service |

### Blocking Chart Column F: Objective
**Source field:** Social = column D; Programmatic = column C
- Maps directly: "Awareness", "Reach (Auction)", "Reach (Reserved)", "Traffic", "Video Views"

### Blocking Chart Column G: Campaign Details - Placements
**Source field:** Social = column E; Programmatic = column D
- Copy directly, preserving line breaks for multi-line placement descriptions

### Blocking Chart Column H: Accutics Campaign Name
- Default: "TBD" for all rows
- Updated later when Accutics taxonomy is generated

### Blocking Chart Column I: Tags Required
- Social platforms: "NA"
- Programmatic (DV360/YouTube): "1x1"
- Programmatic (TTD/CTV): "VAST"

### Blocking Chart Column J: Measurement
- Populated from Social activation column A (Measurement)
- Values: "Single Cell BLS", "Multi Cell BLS", "Not Eligible", or "NA"
- Only populated on the first row of a measurement group

### Blocking Chart Column K: Language
- "EN" or "FR"
- Derived from the section placement within the activation response (EN section vs FR section) or from column G (Language/Geo) in programmatic

### Blocking Chart Column L: Ad Format
**Source field:** Social = column G; Programmatic = derived from column D
- Copy directly (e.g., "Videos: 9X16 (6s and/or 15s)", "15s/30s Video 16x9")

### Blocking Chart Column M: Estimated Viewability % Rates
**Source field:** Programmatic = column J (Est. Viewability%)
- Social: default 0.9 (90%)
- DV360/YouTube: 0.7 (70%)
- CTV: 0.9 (90%)
- Linear/OOH: "NA"

### Blocking Chart Column N: KPI
**Source field:** Social = column H; Programmatic = column H
- Values: "Reach", "VCR", "CTR", "CPM"

### Blocking Chart Column O: KPI Value
**Source field:** Social = column O (KPI Volume) or column I (Target benchmark); Programmatic = column I (KPI Benchmark)
- For Reach: population number
- For VCR: decimal (e.g., 0.95)
- For CTR: decimal (e.g., 0.0068)

### Blocking Chart Column P: Target
**Source field:** Social = column I; Programmatic = column E

**Critical transformation:** The activation response often combines multiple audience segments in a single cell separated by line breaks or dashes. These must be split:
- **Primary audience:** Goes in column P of the main data row
- **Secondary audiences:** Each gets its own row immediately below, with ONLY column P populated

**Splitting rule:** Where a dash-space pattern separates audiences (e.g., "M/F 18-54 3P Flavour Seekers + Sports Enthusiast - 1PD CRM + LAL"), split at " - " to create:
- Row 1 P: "M/F 18-54 3P Flavour Seekers + Sports Enthusiast"
- Row 2 P: "1PD CRM + LAL"

The demographic portion (e.g., "M/F 18-54") can appear in both the primary and secondary rows if it contextually applies.

**Budget and audience principle:** Never split budget by audience segment within a single language. Each language gets one row per tactic, with the full language budget allocated. Multiple audience segments are listed as secondary target rows in column P only, with no budget attached. For example, if DV360 YouTube has four audience segments (A18+ 1PD, A18-34 Affinity/In-Market for both EN and FR), the blocking chart gets two rows (EN and FR), not four. The audience segments appear as secondary P rows beneath each language row. This allows the platform to optimize budget allocation across audiences rather than locking spend to a specific segment.

### Blocking Chart Column Q: Est. CPM
**Source field:** Social = column M; Programmatic = column O
- Dollar value, formatted as currency

### Blocking Chart Column R: Est. Impressions/GRPs
**Formula:** `=U[row]/Q[row]*1000`
- This is always calculated from Gross Budget / CPM, not taken from the activation response

### Blocking Chart Columns S-T: Start Date / End Date
**Source field:** Social = column B (parsed); Programmatic = columns K-L
- Date format: d-mmm (e.g., "18-May")

### Blocking Chart Column U: Gross Budget
**Source field:** Social = column J; Programmatic = column M
- This is the primary budget input. All fees and net budget derive from this.

### Blocking Chart Columns V-AB: Fee Calculations
See Section 4.

---

## 4. Fee Calculation Rules

### Column V: Ad Serving
| Channel Type | Formula |
|-------------|---------|
| Linear / OOH | 0 |
| Social (all platforms) | 0 |
| Programmatic (DV360, TTD, Amazon) | `=R[row]/1000*0.0169` |

### Column W: Tech Fees (Scibids)
| Channel Type | Formula |
|-------------|---------|
| DV360 / YouTube ONLY | `=AB[row]*0.07` |
| All other channels | 0 |

### Column X: Data Fees
- Default: 0 for all rows (unless specific data fees apply)

### Column Y: DV Cost Prebid
| Channel Type | Formula |
|-------------|---------|
| Linear / OOH | 0 |
| Programmatic (all DSPs) | `=((R[row]/1000)*0.027)` |
| Social (all platforms) | `=((R[row]/1000)*0.027)` |

### Column Z: DV Cost Postbid
| Channel Type | Formula |
|-------------|---------|
| Linear / OOH | 0 |
| Programmatic (all DSPs) | `=((R[row]/1000)*0.2)` |
| Social (all platforms) | `=((R[row]/1000)*0.1013)` |

### Column AA: Buffer (+30%)
| Channel Type | Formula |
|-------------|---------|
| Linear / OOH | 0 |
| Programmatic | `=SUM(V[row],X[row],Y[row],Z[row])*1.3` |
| Social | `=SUM(V[row]:Z[row])*1.3` |

### Column AB: Net Budget
- All rows: `=U[row]-AA[row]`

---

## 5. Section Assignment Rules

### How to determine which section a tactic belongs to:

| Platform / Placement | Blocking Chart Section |
|----------------------|----------------------|
| Linear TV (Specialty, Conventional, Integrations) | LINEAR TELEVISION |
| Hot dog stands, sky writing, experiential | OUT OF HOME |
| YouTube, Twitch, OLV | PROGRAMMATIC VIDEO |
| Amazon Prime Video, Netflix CTV, Sportsnet, Fubo, TVA+, Radio Canada, Tou.TV | CONNECTED TV |
| TikTok, Meta, Pinterest, Reddit, Snapchat | SOCIAL |

**Key distinction:** If the content is served on a TV screen (CTV app, streaming service), it goes under CONNECTED TV. If it is online video (YouTube, Twitch), it goes under PROGRAMMATIC VIDEO.

---

## 6. EN/FR Budget Split Rules

- The activation response specifies the EN/FR percentage split (typically 80/20)
- When the activation response provides separate EN and FR line items, use those budgets directly
- When a single line item covers both languages (e.g., DV360 YouTube), split the gross budget using the specified ratio
- Each language gets its own row(s) in the blocking chart

---

## 7. Planner Adjustment Rules

The blocking chart is NOT a direct copy of the activation response. The planner (Lucus) reviews the activation response and may:

1. **Reallocate budget between platforms** (e.g., Reddit dollars to Pinterest)
2. **Remove platforms entirely** (e.g., drop Fubo, reinvest to Amazon)
3. **Split combined line items** into separate language rows
4. **Override CPM estimates** based on historical performance
5. **Add tactics** not in the activation response (e.g., reserved buys like Pulse Premiere, TopView)

These adjustments happen BEFORE the blocking chart is populated and should be captured as configuration inputs to any automation tool.

---

## 7.1 Template Clearing Rule

**Always start from a clean template.** When populating a blocking chart from activation responses, clear all existing data rows from the template first. Never carry over tactics, budgets, or rows from a previous version of the blocking chart. The activation response is the sole source of truth for what appears in the output, plus any planner-added tactics configured through the adjustment layer. Leftover rows from prior drafts cause confusion and audit risk.

---

## 8. Row Ordering Convention

Within each section, rows are ordered:
1. By platform (TikTok first, then Meta, then Pinterest for Social)
2. Within platform: EN rows before FR rows
3. Within language: Brand Say before Other Say
4. Within Brand/Other Say: by objective (Reach > Traffic > Video Views)
5. BLS Cell A rows before Cell B rows

---

## 9. Validation Checks

After populating the blocking chart, verify:
- [ ] Total Gross Budget (F11) matches expected total from activation responses (after adjustments)
- [ ] EN/FR split ratios match expected percentages
- [ ] Every section header SUM formula covers all data rows in its section
- [ ] Every total row references its corresponding section header
- [ ] Grand total row SUMs all channel total rows
- [ ] No formula errors (run recalc)
- [ ] Secondary target rows have no values outside column P
- [ ] All dates are within the campaign flight window
- [ ] Scibids 7% only applies to DV360/YouTube rows

---

## 10. Future MediaOS Implementation Notes

This mapping can be automated as a pipeline:
1. **Input:** Activation response Excel file(s) + planner adjustment config (JSON)
2. **Parse:** Extract tactic data from specified tabs
3. **Transform:** Apply column mapping, fee formulas, EN/FR splits, target splitting
4. **Populate:** Write to blocking chart template preserving all formatting
5. **Validate:** Run checks from Section 9
6. **Output:** Completed blocking chart Excel file

The planner adjustment config would capture:
```json
{
  "budget_reallocations": [
    {"from": "Reddit", "to": "Pinterest", "amount": 40000, "split": {"EN": 0.8, "FR": 0.2}},
    {"from": "Fubo", "to": "Amazon Prime Video", "amount": 40000}
  ],
  "platform_exclusions": ["Reddit", "Fubo"],
  "en_fr_split": {"EN": 0.8, "FR": 0.2},
  "bls_structure": {
    "Meta_EN": "multi_cell",
    "TikTok_EN": "single_cell",
    "Meta_FR": "not_applicable"
  }
}
```

This config becomes the "planner brain" layer that sits between raw activation data and the final blocking chart, capturing the strategic decisions that differentiate a planner's output from a pure data transfer.
