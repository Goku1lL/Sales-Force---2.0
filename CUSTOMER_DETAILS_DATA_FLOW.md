# Customer Details Data Flow

## Overview
This document explains how customer details are fetched from database tables and displayed in the frontend.

---

## Database Tables

### 1. SA_HomePageTargetCustomers
**Used for**: Assigned customers and High-value customers

**Table Structure**:
```sql
- Id (bigint, PK)
- employee_id (varchar)
- customer_id (bigint)
- customername (varchar)        → Customer Name
- contactnumber (bigint)       → Contact Number
- LastOrder (bigint)           → Last Order (days ago)
- description (varchar)        → Category/Group (e.g., "Fruits OC")
- Priority (bigint)            → Priority Level (1, 2, 3...)
- created_at, updated_at
- deleted (boolean)
```

### 2. SA_HomePageAppFunnelCustomers
**Used for**: Inactive/App Funnel customers

**Table Structure**:
```sql
- Id (bigint, PK)
- employee_id (varchar)
- customer_id (bigint)
- customername (varchar)        → Customer Name
- contactnumber (bigint)        → Contact Number
- LastOpened (float)            → Last Opened (days/count)
- description (varchar)         → Category/Page (e.g., "ViewCartPage")
- Priority (bigint)             → Priority Level
```

---

## Backend API Endpoints

### 1. GET `/api/v1/customers/assigned/:employeeId`
**File**: `apps/backend/src/routes/customers.ts` (lines 7-29)

**SQL Query**:
```sql
SELECT 
  Id,
  employee_id,
  customer_id,
  customername,        -- → Displayed as "Customer Name"
  contactnumber,       -- → Displayed as "Contact Number"
  LastOrder,           -- → Displayed as "Last Order: X days ago"
  description,         -- → Used for grouping/tab names
  Priority             -- → Displayed as "Priority 1/2/3"
FROM SA_HomePageTargetCustomers
WHERE employee_id = ? AND deleted = 0
ORDER BY Priority ASC, LastOrder DESC
LIMIT 100
```

**Returns**: Array of customer objects with all fields above

---

### 2. GET `/api/v1/customers/inactive/:employeeId`
**File**: `apps/backend/src/routes/customers.ts` (lines 31-52)

**SQL Query**:
```sql
SELECT 
  Id,
  employee_id,
  customer_id,
  customername,        -- → Displayed as "Customer Name"
  contactnumber,       -- → Displayed as "Contact Number"
  LastOpened,          -- → Displayed as "Last Opened: X days ago"
  description,         -- → Used for grouping/tab names
  Priority             -- → Displayed as "Priority 1/2/3"
FROM SA_HomePageAppFunnelCustomers
WHERE employee_id = ?
ORDER BY LastOpened DESC, Priority ASC
LIMIT 100
```

**Returns**: Array of customer objects

---

### 3. GET `/api/v1/customers/high-value/:employeeId`
**File**: `apps/backend/src/routes/customers.ts` (lines 54-76)

**SQL Query**:
```sql
SELECT 
  Id,
  employee_id,
  customer_id,
  customername,        -- → Displayed as "Customer Name"
  contactnumber,       -- → Displayed as "Contact Number"
  LastOrder,           -- → Displayed as "Last Order: X days ago"
  description,         -- → Used for grouping/tab names
  Priority             -- → Displayed as "Priority 1" (filtered)
FROM SA_HomePageTargetCustomers
WHERE employee_id = ? AND deleted = 0 AND Priority = 1
ORDER BY Priority ASC, LastOrder DESC
LIMIT 50
```

**Returns**: Array of high-priority customers (Priority = 1 only)

---

## Frontend Data Flow

### 1. API Hooks (RTK Query)
**File**: `apps/frontend/src/features/customers/customersApi.ts`

```typescript
// These hooks fetch data from backend endpoints
useGetAssignedCustomersQuery(employeeId)    → GET /customers/assigned/:employeeId
useGetInactiveCustomersQuery(employeeId)     → GET /customers/inactive/:employeeId
useGetHighValueCustomersQuery(employeeId)    → GET /customers/high-value/:employeeId
```

**Returns**: Customer arrays with fields:
- `customername`
- `contactnumber`
- `LastOrder` (for assigned/high-value)
- `LastOpened` (for inactive)
- `description`
- `Priority`
- `Id`

---

### 2. Data Grouping
**File**: `apps/frontend/src/features/customers/CustomersPage.tsx` & `DashboardPage.tsx`

**Process**:
1. Fetch customers from all three endpoints
2. Merge and deduplicate by `Id` (priority: assigned > high > inactive)
3. Group by `description` field
4. Create dynamic tabs/cards for each unique description

**Example**:
```typescript
// Customers grouped by description
{
  "Fruits OC": [
    { customername: "MAA DHARITRI...", contactnumber: "8123509150", LastOrder: 83, Priority: 1 },
    { customername: "Neeladri...", contactnumber: "...", LastOrder: 82, Priority: 1 }
  ],
  "ViewCartPage": [...]
}
```

---

### 3. Display Component
**File**: `apps/frontend/src/features/customers/CustomerCard.tsx`

**Field Mapping**:

| Database Field | Display Location | Format |
|---------------|------------------|--------|
| `customername` | Customer Name (Line 118) | `{r.customername \|\| 'Unknown Customer'}` |
| `contactnumber` | Contact Button (Line 147) | `{String(r.contactnumber)}` - Clickable call button |
| `LastOrder` | Last Order Info (Line 160) | `formatDaysAgo(r.LastOrder)` → "X days ago" |
| `LastOpened` | Last Opened Info (Line 161) | `formatTimeAgo(r.LastOpened)` → "X days ago" |
| `Priority` | Priority Badge (Line 133) | `Priority {r.Priority}` - Color coded (1=red, 2=orange) |
| `description` | Tab/Card Title | Used as section title (e.g., "Fruits OC (14)") |

**Formatting Functions**:

1. **`formatDaysAgo(days)`** (Line 49-52):
   - Input: `LastOrder` (number of days)
   - Output: `"83 days ago"`

2. **`formatTimeAgo(dateValue)`** (Line 34-47):
   - Input: `LastOpened` (date/timestamp)
   - Output: `"X min ago"`, `"X hr ago"`, or `"X days ago"`

3. **Priority Badge** (Line 127-135):
   - Priority 1: Red badge (`bg-red-100 text-red-700`)
   - Priority 2: Orange badge (`bg-orange-100 text-orange-700`)
   - Priority 3+: Gray badge (`bg-gray-100 text-gray-700`)

---

## Complete Data Flow Diagram

```
Database Tables
    ↓
SA_HomePageTargetCustomers  →  GET /customers/assigned/:employeeId
SA_HomePageTargetCustomers  →  GET /customers/high-value/:employeeId
SA_HomePageAppFunnelCustomers → GET /customers/inactive/:employeeId
    ↓
Backend Routes (customers.ts)
    ↓
Frontend API Hooks (customersApi.ts)
    ↓
Data Grouping (CustomersPage.tsx / DashboardPage.tsx)
    - Merge by Id
    - Group by description
    ↓
CustomerCard Component
    - Display customername
    - Display contactnumber (clickable)
    - Display LastOrder/LastOpened (formatted)
    - Display Priority (badge)
```

---

## Example: "Fruits OC (14)" Section

**Data Source**: `SA_HomePageTargetCustomers` table

**Query Filter**: 
- `employee_id = 'NC25624'`
- `description = 'Fruits OC'`
- `deleted = 0`

**Displayed Fields**:
1. **Customer Name**: `customername` → "MAA DHARITRI FRESH FRUIT AND VEGETABLES"
2. **Contact**: `contactnumber` → "8123509150" (clickable green button)
3. **Last Order**: `LastOrder` → "83 days ago" (formatted)
4. **Priority**: `Priority` → "Priority 1" (red badge)

**Section Title**: `description` + count → "Fruits OC (14)"

---

## Key Points

1. **Two tables used**:
   - `SA_HomePageTargetCustomers` → Assigned & High-value customers
   - `SA_HomePageAppFunnelCustomers` → Inactive customers

2. **Grouping**: Customers are grouped by `description` field to create dynamic tabs/sections

3. **Deduplication**: Same customer (same `Id`) appearing in multiple sources is shown only once (priority: assigned > high > inactive)

4. **Formatting**: 
   - `LastOrder` is already in days (no conversion needed)
   - `LastOpened` may need date conversion
   - Priority is displayed as a color-coded badge

5. **Filtering**:
   - Assigned: All customers (`deleted = 0`)
   - High-value: Only `Priority = 1` customers
   - Inactive: All customers from funnel table

