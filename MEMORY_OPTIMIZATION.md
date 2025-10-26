# Memory Optimization Strategy

## Current Configuration

### Memory-Efficient Features

1. **Client-Aware Processing**
   - Only runs queries when clients are actively connected
   - Automatically pauses after 5 minutes of inactivity

2. **Reduced Query Limits**
   - Only fetches **3 activities** (down from 5-10)
   - Limited to recent achievements only

3. **Increased Intervals**
   - Live activity: **60 seconds** (was 30s)
   - Urgent actions: **120 seconds** (was 60s)

4. **Socket.io Memory Management**
   - Proper cleanup on disconnect
   - Interval cleanup on server shutdown
   - Efficient client counting

## Memory Usage with 50 Users

### Expected Memory Breakdown:
- Base Node.js server: ~50MB
- Socket.io connections (50 users × 2KB each): ~100KB
- Database queries (every 60s, limited to 3 records): ~5-10MB
- **Total estimated: ~100-150MB** (well under 512MB limit)

### Why This is Memory-Efficient:
1. **No persistent connections** - Each WebSocket uses minimal memory
2. **Data is fetched once per minute** - Shared across all 50 users
3. **Automatic cleanup** - Inactive users don't consume resources
4. **Small result sets** - Only 3 activities per query

## If Memory Becomes an Issue

### Option 1: Disable Realtime Completely (Static App)
```typescript
// In apps/backend/src/server.ts
// Comment out: startRealtime(io);
```
**Result**: Memory stays under 50MB regardless of users

### Option 2: Increase Query Interval
```typescript
// In apps/backend/src/realtime/publisher.ts
// Change 60000 to 120000 (2 minutes instead of 1 minute)
```

### Option 3: Reduce Activity Limit Further
```typescript
// Change LIMIT 3 to LIMIT 1
```

## Monitoring

Check your Render dashboard logs for:
- Memory usage trends
- Active client count
- Query execution times

If memory exceeds 400MB consistently, consider implementing one of the options above.
