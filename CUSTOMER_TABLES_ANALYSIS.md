# Customer Tables Analysis

## Database Query Results

### 1. SA_HomePageTargetCustomers
**Status**: ✅ **ACTIVELY USED**

**Summary**:
- **Total Records**: 1,285
- **Unique Employees**: 61
- **Unique Customers**: 1,285
- **All records created**: 2025-11-10 (bulk import)

**Table Structure**:
- `Id` (bigint, PK)
- `employee_id` (varchar)
- `customer_id` (bigint)
- `customername` (varchar)
- `contactnumber` (bigint)
- `LastOrder` (bigint) - Days since last order
- `description` (varchar) - e.g., "Fruits OC"
- `Priority` (bigint) - 1 = High priority
- `created_at`, `updated_at` (timestamp)
- `deleted` (boolean) - Soft delete flag

**Backend Usage**:
- **Route**: `GET /api/v1/customers/assigned/:employeeId`
- **File**: `apps/backend/src/routes/customers.ts` (lines 7-29)
- **Query**: Filters by `employee_id`, excludes `deleted = 0`, orders by `Priority ASC, LastOrder DESC`, limit 100

- **Route**: `GET /api/v1/customers/high-value/:employeeId`
- **File**: `apps/backend/src/routes/customers.ts` (lines 54-76)
- **Query**: Same table, but filters `Priority = 1` (high priority only), limit 50

**Frontend Usage**:
- **API Hook**: `useGetAssignedCustomersQuery` (from `customersApi.ts`)
- **API Hook**: `useGetHighValueCustomersQuery` (from `customersApi.ts`)
- **Components**:
  - `CustomersPage.tsx` - Full customer management page with tabs
  - `DashboardPage.tsx` - Shows top 3-5 customers in sidebar/widgets
  - `CustomerCard.tsx` - Reusable card component for displaying customers

**Display Fields**:
- Customer name, contact number (clickable call button)
- Description, Priority badge
- Last Order (days ago)
- Priority-based color coding (1=red, 2=orange, etc.)

---

### 2. SA_HomePageAppFunnelCustomers
**Status**: ✅ **ACTIVELY USED**

**Summary**:
- **Total Records**: 14 (very small dataset)
- **Unique Employees**: 12
- **Unique Customers**: 14
- **LastOpened Range**: 0-5 (appears to be days or count)

**Table Structure**:
- `Id` (bigint, PK)
- `employee_id` (varchar)
- `customer_id` (bigint)
- `customername` (varchar)
- `contactnumber` (bigint)
- `LastOpened` (float) - Days/count since last opened
- `description` (varchar) - e.g., "ViewCartPage", "ViewSummaryPage"
- `Priority` (bigint, nullable)

**Backend Usage**:
- **Route**: `GET /api/v1/customers/inactive/:employeeId`
- **File**: `apps/backend/src/routes/customers.ts` (lines 31-52)
- **Query**: Filters by `employee_id`, orders by `LastOpened DESC, Priority ASC`, limit 100

**Frontend Usage**:
- **API Hook**: `useGetInactiveCustomersQuery` (from `customersApi.ts`)
- **Components**:
  - `CustomersPage.tsx` - "Inactive" tab
  - `DashboardPage.tsx` - Shows top 3-5 inactive customers
  - `CustomerCard.tsx` - Displays with "Last Opened" instead of "Last Order"

**Display Fields**:
- Customer name, contact number
- Description (shows which page they last viewed)
- Last Opened (time ago format)
- Priority badge (if set)

**Note**: This table tracks customers who opened the app but didn't complete actions (funnel tracking).

---

### 3. SA_CustomerPageCustomers
**Status**: ⚠️ **EXISTS BUT NOT USED**

**Summary**:
- **Total Records**: 7,696
- **Unique Employees**: 61
- **Unique Customers**: 1,365
- **Much larger dataset** than the other two tables

**Table Structure**:
- `Id` (bigint, PK)
- `metric` (varchar) - e.g., "Fruits OC"
- `date` (date)
- `yearweek` (bigint, nullable)
- `skuid` (bigint) - Product SKU ID
- `employee_id` (varchar)
- `customer_id` (bigint)
- `customername` (varchar)
- `contactnumber` (bigint)
- `description` (varchar) - e.g., "Fruits OC"
- `Priority` (bigint)
- `layer` (varchar) - e.g., "day" (indicates day/week layer)
- `Sku` (varchar) - Product name, e.g., "Apple Shimla (50 Count)"

**Key Differences from Other Tables**:
1. **Product-level granularity**: Contains SKU-level data (specific products)
2. **Time-based**: Has `date` and `yearweek` fields for temporal filtering
3. **Metric-specific**: Has `metric` field (e.g., "Fruits OC")
4. **Layer field**: Indicates whether it's "day" or "week" level data

**Backend Usage**: ❌ **NOT USED** - No API endpoints query this table

**Frontend Usage**: ❌ **NOT USED** - No components reference this table

**Potential Use Case**:
This table appears designed for a **detailed customer-product view** on a customer page, showing:
- Which products each customer has ordered
- When they ordered (date/week)
- For which metrics
- At what time granularity (day/week)

**Sample Data**:
```json
{
  "Id": "169737",
  "metric": "Fruits OC",
  "date": "2025-11-10",
  "skuid": "112640",
  "employee_id": "CNC4972",
  "customer_id": "3873",
  "customername": "AGRI SIRI",
  "Sku": "Apple Shimla (50 Count)",
  "layer": "day",
  "Priority": "1"
}
```

---

## Frontend-Backend Wiring Summary

### API Endpoints (Backend → Frontend)

| Endpoint | Table | Frontend Hook | Used In |
|----------|-------|---------------|---------|
| `GET /customers/assigned/:employeeId` | `SA_HomePageTargetCustomers` | `useGetAssignedCustomersQuery` | `CustomersPage`, `DashboardPage` |
| `GET /customers/inactive/:employeeId` | `SA_HomePageAppFunnelCustomers` | `useGetInactiveCustomersQuery` | `CustomersPage`, `DashboardPage` |
| `GET /customers/high-value/:employeeId` | `SA_HomePageTargetCustomers` (Priority=1) | `useGetHighValueCustomersQuery` | `CustomersPage`, `DashboardPage` |

### Frontend Components

1. **`CustomersPage.tsx`** (`/customers` route)
   - Full page with 3 tabs: Assigned, Inactive, High Value
   - Shows all customers with full details
   - Uses `CustomerCard` component

2. **`DashboardPage.tsx`** (`/dashboard` route)
   - Shows top 3-5 customers in sidebar (desktop)
   - Shows top 5 customers in mobile view
   - Uses same `CustomerCard` component
   - Displays: Assigned, Inactive, High Value customers

3. **`CustomerCard.tsx`** (Reusable component)
   - Displays customer cards with:
     - Avatar (first letter of name)
     - Customer name
     - Description
     - Priority badge (color-coded)
     - Contact number (clickable call button)
     - Last Order/Last Opened time
   - Adapts display based on `tabType` prop

### Data Flow

```
Database Tables
    ↓
Backend Routes (customers.ts)
    ↓
Frontend API Hooks (customersApi.ts)
    ↓
React Components (CustomersPage, DashboardPage)
    ↓
CustomerCard (UI Component)
```

---

## Recommendations

1. **SA_CustomerPageCustomers**: This table exists with substantial data (7,696 records) but is not currently used. Consider:
   - Creating a customer detail page that shows product-level history
   - Adding an endpoint like `GET /customers/:customerId/products` or `GET /customers/:customerId/history`
   - Using this for detailed customer analytics

2. **Data Freshness**: All records in `SA_HomePageTargetCustomers` were created on 2025-11-10, suggesting a bulk import. Consider:
   - Verifying if this is a one-time import or if new records are being added
   - Checking if there's a sync process that updates these tables

3. **SA_HomePageAppFunnelCustomers**: Very small dataset (14 records). Consider:
   - Verifying if this is actively being populated
   - Checking if there's an event tracking system that should be writing to this table

---

## Files Reference

**Backend**:
- `apps/backend/src/routes/customers.ts` - API endpoints
- `apps/backend/prisma/schema.prisma` - Table definitions (lines 25771-25822)

**Frontend**:
- `apps/frontend/src/features/customers/customersApi.ts` - RTK Query hooks
- `apps/frontend/src/features/customers/CustomersPage.tsx` - Full customer page
- `apps/frontend/src/features/customers/CustomerCard.tsx` - Reusable card component
- `apps/frontend/src/features/dashboard/DashboardPage.tsx` - Dashboard integration

