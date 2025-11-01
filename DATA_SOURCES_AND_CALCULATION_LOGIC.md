# Data Sources and Calculation Logic Documentation

## Overview
This document explains where dashboard data comes from and how calculations are performed for earnings, targets, achievements, and bonuses.

---

## Database Tables Used

### 1. **Executive Table**
**Purpose**: Stores employee basic information

**Key Fields**:
- `employee_id` (varchar) - Employee identifier
- `variable_pay` (float) - Monthly variable pay amount
- `cluster` (varchar) - Employee's cluster
- `CityId` (bigint) - City identifier
- `deleted` (tinyint) - Soft delete flag

**Usage**: 
- Get employee's monthly variable pay
- Calculate base pay: `dailyBasePay = variable_pay / 30`, `weeklyBasePay = variable_pay / 4`

**Query Example**:
```sql
SELECT variable_pay FROM Executive 
WHERE employee_id = ? AND deleted = 0
```

---

### 2. **DayAchievement Table**
**Purpose**: Stores daily achievements by metric

**Key Fields**:
- `employee_id` (varchar)
- `metric` (varchar) - Metric name (e.g., "Fruits OC", "GT OC")
- `date` (date) - Achievement date
- `Achievement` (float) - Achievement value (units)
- `variable_pay` (float) - Legacy field (usually 0)
- `deleted` (tinyint)

**Usage**: 
- Get daily achievements grouped by metric
- Sum achievements per metric to avoid duplication across slabs

**Query Example**:
```sql
SELECT metric, SUM(Achievement) as achievement, SUM(variable_pay) as variable_pay
FROM DayAchievement 
WHERE employee_id = ? AND date = ? AND deleted = 0
GROUP BY metric
```

---

### 3. **WeekAchievement Table**
**Purpose**: Stores weekly achievements by metric

**Key Fields**:
- `employee_id` (varchar)
- `metric` (varchar) - Metric name
- `yearweek` (varchar) - Week identifier (e.g., "202544")
- `Achievement` (float) - Achievement value (units)
- `variable_pay` (float) - Legacy field (usually 0)
- `deleted` (tinyint)

**Usage**: 
- Get weekly achievements for current week
- Used for AB metrics (always weekly) and weekly view

**Query Example**:
```sql
SELECT metric, SUM(Achievement) as achievement, SUM(variable_pay) as variable_pay
FROM WeekAchievement 
WHERE employee_id = ? AND yearweek = (SELECT MAX(yearweek) FROM WeekTargets WHERE employee_id = ? AND deleted = 0) AND deleted = 0
GROUP BY metric
```

---

### 4. **DayTargets Table**
**Purpose**: Stores daily targets with slab breakdown

**Key Fields**:
- `employee_id` (varchar)
- `metric` (varchar) - Metric name
- `date` (date) - Target date
- `target` (float) - Target value for this slab
- `slab_Segment` (varchar) - Slab identifier (e.g., "slab1", "slab2", "slab3")
- `incentive_percent` (float) - Incentive multiplier for this slab (1.0, 1.5, 2.0)
- `contribution` (float) - Metric contribution percentage (0.0 to 1.0)
- `deleted` (tinyint)

**Usage**: 
- Get all slabs for daily targets
- Determine highest target (highest slab)
- Get incentive multipliers for each slab
- Get contribution percentage

**Query Example**:
```sql
SELECT metric, target, slab_Segment, incentive_percent, contribution
FROM DayTargets
WHERE employee_id = ? AND date = ? AND deleted = 0
ORDER BY metric, slab_Segment
```

**Slab Structure Example**:
- **Slab 1**: target = 10, incentive_percent = 1.0 (100%)
- **Slab 2**: target = 15, incentive_percent = 1.5 (150%)
- **Slab 3**: target = 23.1, incentive_percent = 2.0 (200%)

---

### 5. **WeekTargets Table**
**Purpose**: Stores weekly targets with slab breakdown

**Key Fields**:
- `employee_id` (varchar)
- `metric` (varchar) - Metric name
- `yearweek` (varchar) - Week identifier
- `target` (float) - Target value for this slab
- `slab_Segment` (varchar) - Slab identifier
- `incentive_percent` (float) - Incentive multiplier
- `contribution` (float) - Metric contribution percentage
- `deleted` (tinyint)

**Usage**: 
- Get weekly targets for current week
- Same structure as DayTargets but for weekly period
- Used for AB metrics and weekly view

**Query Example**:
```sql
SELECT metric, target, slab_Segment, incentive_percent, contribution
FROM WeekTargets
WHERE employee_id = ? AND yearweek = (SELECT MAX(yearweek) FROM WeekTargets WHERE employee_id = ? AND deleted = 0) AND deleted = 0
ORDER BY metric, slab_Segment
```

---

### 6. **SA_EmployeeBonus Table**
**Purpose**: Stores rank-based bonus data for employees who achieved bonus tiers

**Key Fields**:
- `employee_id` (varchar)
- `metric` (varchar) - Metric name
- `steps` (varchar) - Period type (always "week")
- `steps_value` (varchar) - Week identifier (yearweek)
- `rank` (bigint) - Employee's rank (1-5, 6-10, 11-15, etc.)
- `bonus_achievement` (float) - Bonus amount earned
- `deleted` (tinyint)

**Usage**: 
- Get current bonus amount and rank for each metric
- Only exists for employees who reached slab 3 target

**Query Example**:
```sql
SELECT metric, rank, bonus_achievement
FROM SA_EmployeeBonus
WHERE employee_id = ? AND steps = 'week' AND steps_value = ? AND deleted = 0
```

---

### 7. **SA_Bonus Table**
**Purpose**: Stores bonus tier configuration (rank ranges and multipliers)

**Key Fields**:
- `metric` (varchar) - Metric name (e.g., "Fruits AB")
- `steps` (varchar) - Period type (always "week")
- `target` (float) - Slab 3 target (e.g., 25)
- `start_rank` (bigint) - Starting rank (e.g., 1, 6, 11)
- `end_rank` (bigint) - Ending rank (e.g., 5, 10, 15)
- `bonus_percent` (float) - Bonus multiplier (2.0 = 200%, 1.5 = 150%, 1.0 = 100%)
- `deleted` (tinyint)

**Usage**: 
- Get bonus tier ranges for motivational display
- Determine highest bonus multiplier available
- Show employees what bonus they could earn

**Query Example**:
```sql
SELECT start_rank, end_rank, bonus_percent, target
FROM SA_Bonus
WHERE metric IN (?, ?) AND steps = 'week' AND deleted = 0
ORDER BY metric, start_rank
```

**Example Data**:
- Rank 1-5: bonus_percent = 2.0 (200% bonus)
- Rank 6-10: bonus_percent = 1.5 (150% bonus)
- Rank 11-15: bonus_percent = 1.0 (100% bonus, no extra)

---

## Calculation Logic

### Step 1: Base Pay Calculation

```
monthlyVariablePay = Executive.variable_pay
dailyBasePay = monthlyVariablePay / 30
weeklyBasePay = monthlyVariablePay / 4
```

**Example**: If `variable_pay = ₹30,000/month`:
- `dailyBasePay = ₹30,000 / 30 = ₹1,000/day`
- `weeklyBasePay = ₹30,000 / 4 = ₹7,500/week`

---

### Step 2: Slab Multiplier Determination

**Function**: `getSlabMultiplier(achievement, targets[])`

**Logic**:
1. Sort slabs by target (ascending): slab1 < slab2 < slab3
2. Start with lowest slab multiplier (slab1)
3. Loop through slabs in order:
   - If `achievement >= slab.target`, use that slab's `incentive_percent`
   - Continue until achievement doesn't reach next slab
4. Return the highest slab multiplier reached

**Example**:
- Slab 1: target = 10, incentive_percent = 1.0
- Slab 2: target = 15, incentive_percent = 1.5
- Slab 3: target = 23.1, incentive_percent = 2.0

If achievement = 0: multiplier = 1.0 (slab 1)
If achievement = 12: multiplier = 1.5 (slab 2)
If achievement = 23.1: multiplier = 2.0 (slab 3)

---

### Step 3: Base Earnings Calculation

**For Daily Metrics**:
```
metricBasePay = dailyBasePay × contribution
achievementRatio = achievement / totalTarget  (if totalTarget > 0, else 0)
earned = metricBasePay × achievementRatio × slabMultiplier
```

**For Weekly Metrics**:
```
metricBasePay = weeklyBasePay × contribution
achievementRatio = achievement / totalTarget
earned = metricBasePay × achievementRatio × slabMultiplier
```

**Example** (Weekly, Fruits Retention AB):
- `weeklyBasePay = ₹7,500`
- `contribution = 0.5` (50%)
- `metricBasePay = ₹7,500 × 0.5 = ₹3,750`
- `achievement = 0`, `totalTarget = 23.1`
- `achievementRatio = 0 / 23.1 = 0`
- `slabMultiplier = 1.0` (slab 1, since achievement = 0)
- `earned = ₹3,750 × 0 × 1.0 = ₹0`

**If achievement = 23.1 (100% of target)**:
- `achievementRatio = 23.1 / 23.1 = 1.0` (100%)
- `slabMultiplier = 2.0` (reached slab 3)
- `earned = ₹3,750 × 1.0 × 2.0 = ₹7,500`

---

### Step 4: Bonus Addition

**If employee has bonus in SA_EmployeeBonus**:
```
totalEarnings = baseEarnings + bonusAmount
```

**Example**:
- Base earnings = ₹7,500 (slab 3)
- Rank = 6 (Top 6-10 tier)
- Bonus amount = ₹3,750 (150% of base = 1.5 × ₹7,500 - ₹7,500)
- Total earnings = ₹7,500 + ₹3,750 = ₹11,250

---

### Step 5: Max Potential Earnings Calculation

**Frontend Calculation Logic** (per slab):
```
potentialEarnings = periodVariablePay × incentivePercent
```

**Where**:
- For **non-AB metrics (day view)**: `periodVariablePay = monthlyVariablePay × (1/30)`
- For **non-AB metrics (week view)**: `periodVariablePay = monthlyVariablePay × (1/4)`
- For **AB metrics (always weekly)**: `periodVariablePay = monthlyVariablePay × (1/4)`
- `incentivePercent` = incentive_percent from the slab (1.0, 1.5, 2.0)

**Note**: The frontend calculation does NOT include contribution in max potential calculation - it shows full potential.

**Max Potential (across all slabs)**:
```
maxPotentialEarnings = MAX(potentialEarnings for slab1, slab2, slab3)
```

**With Bonus Multiplier** (if bonus tiers exist):
```
highestBonusMultiplier = SA_Bonus.bonus_percent (from Rank 1-5 tier, typically 2.0)
maxPotentialEarnings = baseMaxPotential × highestBonusMultiplier
```

**Example** (Fruits Retention AB, from image showing ₹1,250):

**Base Calculation**:
- `monthlyVariablePay = ₹5,000` (example)
- `weeklyBasePay = ₹5,000 / 4 = ₹1,250`
- For **slab 3**: `incentive_percent = 2.0`
- `potentialEarnings (slab 3) = ₹1,250 × 2.0 = ₹2,500`

**But image shows ₹1,250**, which suggests:
- Either calculating for **slab 1** only: `₹1,250 × 1.0 = ₹1,250`
- Or `monthlyVariablePay = ₹5,000` and showing slab 1 potential
- Or bonus tier is not yet applied/configured

**If bonus tier exists and applied**:
- `baseMaxPotential = ₹1,250` (slab 1) or `₹2,500` (slab 3)
- `highestBonusMultiplier = 2.0` (Rank 1-5 = 200%)
- `maxPotential = ₹1,250 × 2.0 = ₹2,500` OR `₹2,500 × 2.0 = ₹5,000`

**Backend Calculation** (for actual earnings, includes contribution):
```typescript
// Base earnings calculation (includes contribution)
metricBasePay = periodBasePay × contribution
earned = metricBasePay × achievementRatio × slabMultiplier
```

**Frontend Calculation** (for max potential display, doesn't include contribution):
```typescript
// Max potential calculation (doesn't include contribution - shows full potential)
potentialEarnings = periodVariablePay × incentivePercent
maxPotentialEarnings = MAX(all slab potentials)
// Then multiply by bonus multiplier if exists
```

---

### Step 6: Pending to Earn Calculation

```
pendingToEarn = maxPotentialEarnings - totalEarnings
```

**Where**:
- `maxPotentialEarnings` = Base earnings at highest slab × Highest bonus multiplier
- `totalEarnings` = Base earnings + Current bonus (if any)

**Example**:
- `maxPotential = ₹15,000` (₹7,500 base × 2.0 bonus)
- `totalEarnings = ₹0` (no achievement yet)
- `pendingToEarn = ₹15,000 - ₹0 = ₹15,000`

**If they earned something**:
- `maxPotential = ₹15,000`
- `totalEarnings = ₹11,250` (₹7,500 base + ₹3,750 bonus at rank 6-10)
- `pendingToEarn = ₹15,000 - ₹11,250 = ₹3,750` (gap to reach rank 1-5)

---

## Data Flow Diagram

```
1. Executive Table
   └─> variable_pay → dailyBasePay / weeklyBasePay

2. DayAchievement / WeekAchievement
   └─> Achievement (units) → achievementRatio

3. DayTargets / WeekTargets
   └─> target, slab_Segment, incentive_percent, contribution
   └─> Determine slabMultiplier based on achievement vs targets

4. Calculate Base Earnings
   └─> baseEarnings = basePay × contribution × achievementRatio × slabMultiplier

5. SA_EmployeeBonus (if exists)
   └─> bonusAmount, rank
   └─> totalEarnings = baseEarnings + bonusAmount

6. SA_Bonus
   └─> bonus tiers, multipliers
   └─> maxPotential = baseMaxPotential × highestBonusMultiplier

7. Calculate Pending
   └─> pending = maxPotential - totalEarnings
```

---

## Example Calculation Walkthrough

**Scenario**: Employee SNC1145, Fruits Retention AB metric

### Step 1: Get Base Data
- `variable_pay = ₹30,000/month` → `weeklyBasePay = ₹7,500`
- `contribution = 0.5` (50%)
- `metricBasePay = ₹7,500 × 0.5 = ₹3,750`

### Step 2: Get Targets
- Slab 1: target = 10, incentive_percent = 1.0
- Slab 2: target = 15, incentive_percent = 1.5
- Slab 3: target = 23.1, incentive_percent = 2.0
- `totalTarget = 23.1` (highest slab)

### Step 3: Get Achievement
- `achievement = 0` (from WeekAchievement table)

### Step 4: Calculate Slab Multiplier
- Achievement = 0, so `slabMultiplier = 1.0` (slab 1)

### Step 5: Calculate Base Earnings
- `achievementRatio = 0 / 23.1 = 0`
- `earned = ₹3,750 × 0 × 1.0 = ₹0`

### Step 6: Calculate Max Potential (Slab 3)
- At slab 3: `baseMaxPotential = ₹3,750 × 2.0 = ₹7,500`
- But the image shows ₹1,250, which suggests:
  - **Possible calculation**: `₹3,750 × (1/3) = ₹1,250` (but this doesn't match the formula)
  - **Or**: The base pay calculation might be different
  - **Or**: The display shows potential for slab 1 only initially

### Step 7: Apply Bonus Multiplier (if bonus tiers exist)
- If bonus tier exists: `maxPotential = ₹1,250 × 2.0 = ₹2,500`
- But image shows ₹1,250, so bonus multiplier may not be applied yet OR no bonus tier configured

### Step 8: Calculate Pending
- `pending = ₹1,250 - ₹0 = ₹1,250`

---

## Key Notes

1. **AB Metrics**: Always use weekly data, even when DAY toggle is selected
2. **Achievements**: Grouped by metric (SUM) to avoid duplication across slabs
3. **Targets**: Use MAX target across slabs to get highest slab target
4. **Slab Multiplier**: Determines which incentive percentage to apply based on achievement
5. **Bonus**: Only applies if employee reached slab 3 target (e.g., 25 units)
6. **Max Potential**: 
   - Frontend shows full potential (without contribution factor)
   - Includes bonus multiplier if bonus tiers are configured
7. **Actual Earnings**: Includes contribution percentage in calculation
8. **Pending**: Shows gap to reach maximum earning potential including bonuses
9. **Contribution Discrepancy**: Max potential doesn't include contribution, but actual earnings do - this is intentional to show full earning potential

---

## Quick Reference Table

| Data Element | Source Table | Key Fields | Calculation |
|-------------|--------------|------------|-------------|
| **Employee Base Pay** | `Executive` | `variable_pay` | `daily = variable_pay / 30`<br>`weekly = variable_pay / 4` |
| **Daily Achievement** | `DayAchievement` | `metric`, `Achievement`, `date` | `SUM(Achievement) GROUP BY metric` |
| **Weekly Achievement** | `WeekAchievement` | `metric`, `Achievement`, `yearweek` | `SUM(Achievement) GROUP BY metric` |
| **Daily Targets** | `DayTargets` | `metric`, `target`, `slab_Segment`, `incentive_percent`, `contribution`, `date` | Get all slabs, use MAX(target) |
| **Weekly Targets** | `WeekTargets` | `metric`, `target`, `slab_Segment`, `incentive_percent`, `contribution`, `yearweek` | Get all slabs, use MAX(target) |
| **Rank Bonus** | `SA_EmployeeBonus` | `metric`, `rank`, `bonus_achievement`, `steps_value` | Filter by current yearweek |
| **Bonus Tiers** | `SA_Bonus` | `metric`, `start_rank`, `end_rank`, `bonus_percent`, `target` | Get all tiers for metric |

---

## Calculation Formulas Summary

### Base Earnings
```
earned = (basePay × contribution) × (achievement / target) × slabMultiplier
```

### Max Potential (Frontend - without contribution)
```
baseMaxPotential = basePay × highestSlabIncentive
maxPotential = baseMaxPotential × highestBonusMultiplier (if bonus tiers exist)
```

### Total Earnings (with bonus)
```
totalEarnings = baseEarnings + bonusAmount (if rank bonus exists)
```

### Pending to Earn
```
pending = maxPotential - totalEarnings
```

---

## API Endpoints

1. **Dashboard Summary**: `/api/v1/dashboard/summary?employeeId=XXX`
   - Returns: today/weekly totals, earnings, targets, achievements
   - Uses: DayTargets for today, WeekTargets for current week

2. **Employee Details**: `/api/v1/leaderboard/employee-details/:employeeId`
   - Returns: Detailed metrics with slabs, achievements, earnings, bonus data, bonus tiers
   - Uses: DayTargets for today (daily metrics), WeekTargets for current week (weekly metrics + AB metrics)

---

## Why Data Shows When DayTargets is Empty for Today

### The Answer: AB Metrics Always Use Weekly Data

**Frontend Data Source**: 
The Performance Overview section uses `employeeDetails` from `/api/v1/leaderboard/employee-details/:employeeId`, NOT the dashboard summary API.

**Key Logic**:
```typescript
// In DashboardPage.tsx
const { data: employeeDetails } = useGetEmployeeDetailsQuery(employeeId || '', { skip: !employeeId });

// When DAY toggle is selected:
const displayMetrics = viewMode === 'day'
  ? [
      // Daily metrics (non-AB) from employeeDetails.daily
      ...filterMetrics(employeeDetails.daily?.metrics || [], 'day'),
      // BUT: AB metrics ALWAYS come from weekly, even in DAY view!
      ...abMetrics // Always from employeeDetails.weekly
    ]
  : (employeeDetails.weekly?.metrics || []);
```

**What Happens**:
1. DayTargets table has NO data for today (2025-11-01) ✅ Confirmed
2. WeekTargets table HAS data for current week (yearweek 202545) ✅ Confirmed
3. Frontend queries `/employee-details/SNC1145` which:
   - Gets daily data from DayTargets (empty for today)
   - Gets weekly data from WeekTargets (has data for current week)
4. When DAY toggle is selected:
   - Non-AB metrics: Uses `employeeDetails.daily` (empty, so nothing shows)
   - **AB metrics (Fruits Retention AB)**: Uses `employeeDetails.weekly` (has data!)
5. Result: "Fruits Retention AB" shows from WeekTargets even though it's "DAY" view

**Data Source Summary**:
- **"Fruits Retention AB" showing target 23.1**: From `WeekTargets` table, yearweek 202545
- **"Fruits Retention AB" showing ₹1,250 potential**: Calculated from `WeekTargets` data
- **Why it works**: AB metrics always use weekly data, regardless of DAY/WEEK toggle

**This is why the info banner says**: "AB metrics are displayed at weekly level" 🎯

