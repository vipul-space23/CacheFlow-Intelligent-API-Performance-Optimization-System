# ⚡ CacheFlow — Intelligent API Performance Optimization System

> A production-grade, two-tier caching middleware built from scratch using a custom LRU (Least Recently Used) data structure, Redis, MongoDB, and a live React dashboard.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Architecture](#-architecture)
3. [Caching Strategy — How It Works](#-caching-strategy--how-it-works)
4. [Tech Stack](#-tech-stack)
5. [Project Structure](#-project-structure)
6. [Data Models](#-data-models)
7. [API Reference](#-api-reference)
8. [Frontend Dashboard](#-frontend-dashboard)
9. [Getting Started](#-getting-started)
10. [Performance Results](#-performance-results)

---

## 🎯 Project Overview

CacheFlow is a **middleware-level API caching system** that demonstrates a real-world two-tier cache architecture:

```
Client Request
      │
      ▼
 L1: In-Memory LRU Cache   ← O(1) get/put, ~0.1ms
      │  (miss)
      ▼
 L2: Redis Cache            ← Shared/persistent, ~1–3ms
      │  (miss)
      ▼
 Database (MongoDB / Mock)  ← Real DB, 100–700ms
      │
      ▼
 Response + Cache Population
```

**Key Goals:**
- Demonstrate cache hit rate improvement from 0% → 95%+ with repeated requests
- Show L1 latency (~0.1ms) vs DB latency (~500ms) live on the dashboard
- Build the LRU cache from scratch using a **HashMap + Doubly Linked List** (O(1) operations)
- Provide live telemetry: hit/miss counters, per-endpoint stats, rolling time-series charts
- Traffic simulator to stress-test any endpoint and measure cache performance

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND  (React + Vite)                 │
│  ┌───────────┐ ┌───────────────┐ ┌───────────┐ ┌────────────┐  │
│  │ Dashboard │ │ Cache Explorer│ │ Simulator │ │ Data Pages │  │
│  │ (metrics) │ │  (LRU state)  │ │ (traffic) │ │ P/U/O      │  │
│  └─────┬─────┘ └──────┬────────┘ └─────┬─────┘ └─────┬──────┘  │
│        └──────────────┴──────────────── ┴─────────────┘         │
│                         HTTP / REST API                          │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                       BACKEND  (Node.js + Express)              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Cache Middleware                       │   │
│  │  1. Check L1 (in-memory LRU)  → HIT → return + record   │   │
│  │  2. Check L2 (Redis)          → HIT → promote to L1     │   │
│  │  3. Call Route Handler        → DB  → store in L1 + L2  │   │
│  │                                                          │   │
│  │  Sets response headers:                                  │   │
│  │    X-Cache-Source: L1-LRU | L2-Redis | DB               │   │
│  │    X-Cache-Latency: <ms>                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐    │
│  │   Routes    │  │  Telemetry  │  │   LRU Cache Engine   │    │
│  │  /products  │  │  (metrics)  │  │  HashMap + DLL       │    │
│  │  /users     │  │  per-ep     │  │  Capacity: 200       │    │
│  │  /orders    │  │  time-series│  │  TTL: 60s default    │    │
│  │  /analytics │  │             │  │  O(1) get/put/del    │    │
│  │  /simulator │  └─────────────┘  └──────────────────────┘    │
│  └─────────────┘                                                 │
└──────┬──────────────────────────────────────────┬───────────────┘
       │                                          │
┌──────▼──────┐                          ┌────────▼────────┐
│   MongoDB   │                          │  Redis (Docker) │
│  localhost  │                          │  localhost:6379 │
│   :27017    │                          │  L2 Cache       │
│  (optional) │                          │  TTL: 60s       │
└─────────────┘                          └─────────────────┘
```

---

## 🔁 Caching Strategy — How It Works

### L1: Custom LRU Cache (In-Memory)

Built from scratch using two data structures working together:

```
HashMap  →  O(1) key lookup          { "/api/products" → Node }
DLL      →  O(1) eviction ordering   HEAD ↔ [recent] ↔ [older] ↔ TAIL

GET flow:
  1. Check HashMap → not found → MISS
  2. Found → check TTL → expired → remove + MISS
  3. Found, valid → move node to HEAD → HIT

PUT flow:
  1. Key exists → update value + move to HEAD
  2. New key → create node at HEAD
  3. map.size > capacity → evict node at TAIL (LRU)
```

**Properties:**
| Property       | Value                    |
|----------------|--------------------------|
| Capacity       | 200 entries              |
| Default TTL    | 60 seconds               |
| Time Complexity| O(1) get / put / delete  |
| Space          | O(n) where n = capacity  |
| Eviction Policy| LRU (Least Recently Used)|
| Byte Tracking  | Yes (per-entry + total)  |

### L2: Redis (Distributed Cache)

- Acts as a shared persistent cache layer across server restarts
- Stores serialized JSON with `SETEX` (TTL = 60s)
- If Redis is unavailable, server **gracefully degrades** to L1-only
- Auto-reconnect is disabled to fail fast and avoid connection spam

### Cache Middleware Flow

```javascript
GET /api/products
  │
  ├─► L1 hit?  → return JSON + header X-Cache-Source: L1-LRU   (~0.1ms)
  │
  ├─► L2 hit?  → promote to L1 + return  X-Cache-Source: L2-Redis (~1-3ms)
  │
  └─► Route handler runs → DB query → intercept res.json()
        → store in L1 + L2 → return  X-Cache-Source: DB  (~100-700ms)
```

### Cache Invalidation

- **TTL-based**: entries auto-expire after 60s in both L1 and L2
- **Manual**: `DELETE /api/products/:id/cache` invalidates both layers
- **Flush all**: `DELETE /api/analytics/cache` clears entire L1

---

## 🛠 Tech Stack

### Backend

| Technology   | Role                                        |
|-------------|---------------------------------------------|
| **Node.js** | Runtime environment                         |
| **Express 5**| HTTP server + routing                      |
| **MongoDB** | Primary database (optional, with fallback)  |
| **Mongoose**| ODM for MongoDB models                      |
| **Redis**   | L2 distributed cache (via `redis` npm pkg)  |
| **dotenv**  | Environment variable management             |
| **nodemon** | Hot-reload during development               |

### Frontend

| Technology      | Role                                     |
|----------------|------------------------------------------|
| **React 19**   | UI framework                             |
| **Vite 8**     | Build tool + dev server                  |
| **Recharts**   | Charts (AreaChart, BarChart)             |
| **Lucide React**| Icons                                  |
| **Vanilla CSS**| Styling (no Tailwind — full control)    |

### Infrastructure

| Service         | Setup                              |
|-----------------|-------------------------------------|
| **Redis**       | Docker: `redis:alpine` on port 6379 |
| **MongoDB**     | Local or Atlas (optional)           |

---

## 📁 Project Structure

```
lru-cachinggg/
├── backend/
│   ├── .env                          # PORT, MONGODB_URI, REDIS_URL
│   ├── package.json
│   └── src/
│       ├── server.js                 # Express app + startup orchestration
│       ├── cache/
│       │   ├── lruCache.js           # 🔑 Custom LRU: HashMap + DLL (O(1))
│       │   ├── middleware.js         # Cache middleware: L1 → L2 → DB
│       │   └── redisClient.js        # Redis connection + graceful fallback
│       ├── db/
│       │   ├── connect.js            # MongoDB connection + status
│       │   └── seed.js               # Seed 100 products, 50 users, 200 orders
│       ├── models/
│       │   ├── Product.js            # Mongoose schema: name, price, category…
│       │   ├── User.js               # Mongoose schema: name, email, role…
│       │   └── Order.js              # Mongoose schema: userId, productId, status…
│       ├── routes/
│       │   ├── products.js           # GET /api/products, /categories, /:id
│       │   ├── users.js              # GET /api/users, /:id, /:id/orders
│       │   ├── orders.js             # GET /api/orders, /:id
│       │   ├── analytics.js          # GET metrics, timeseries, endpoints, cache-entries
│       │   └── simulator.js          # POST /api/simulator/run — traffic simulation
│       ├── services/
│       │   └── telemetry.js          # In-memory metrics: hits, misses, latency, time-series
│       └── utils/
│           └── mockDB.js             # DB abstraction: MongoDB or in-memory fallback
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx                   # Root: page routing + status polling
        ├── api.js                    # Fetch wrappers for all backend endpoints
        ├── index.css                 # Design system: tokens, layout, components
        ├── main.jsx
        └── components/
            ├── layout/
            │   └── Sidebar.jsx       # Nav (Core + Data sections) + live status badges
            └── dashboard/
                ├── Dashboard.jsx     # KPI cards + Recharts + Top Endpoints table
                ├── CacheExplorer.jsx # Live LRU state: entries, TTL, byte sizes
                ├── TrafficSimulator.jsx # Simulate N requests → chart results
                ├── Settings.jsx      # Toggle config + Flush/Reset actions
                ├── ProductsPage.jsx  # Paginated products + category filter
                ├── UsersPage.jsx     # User list + expandable order history
                └── OrdersPage.jsx    # Orders + status filter chips
```

---

## 📦 Data Models

### Product
```js
{
  name:        String,   // "Apple Product 1"
  price:       Number,   // 299.99
  category:    String,   // "Electronics" | "Clothing" | "Books" | ...
  brand:       String,   // "Apple" | "Samsung" | ...
  stock:       Number,   // units available
  rating:      Number,   // 3.0 – 5.0
  reviews:     Number,   // total review count
  description: String,
  createdAt:   Date
}
```

### User
```js
{
  name:      String,   // "User 1"
  email:     String,   // "user1@cacheflow.dev"
  role:      String,   // "admin" | "customer" | "seller"
  orders:    Number,   // order count
  active:    Boolean,
  createdAt: Date
}
```

### Order
```js
{
  userId:    ObjectId → User,     // populated on fetch
  productId: ObjectId → Product,  // populated on fetch
  quantity:  Number,
  total:     Number,   // price × quantity
  status:    String,   // "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  createdAt: Date
}
```

---

## 🔌 API Reference

### System
| Method | Endpoint       | Description                              |
|--------|---------------|------------------------------------------|
| GET    | `/health`      | Health check                             |
| GET    | `/api/status`  | Live Redis + MongoDB connectivity status |

### Products
| Method | Endpoint                      | Description                         |
|--------|------------------------------|-------------------------------------|
| GET    | `/api/products`               | All products (page, limit, category)|
| GET    | `/api/products/categories`    | Category list with counts           |
| GET    | `/api/products/:id`           | Single product by ID                |
| DELETE | `/api/products/:id/cache`     | Invalidate cache for a product      |

### Users
| Method | Endpoint               | Description                    |
|--------|------------------------|--------------------------------|
| GET    | `/api/users`           | All users (page, limit)        |
| GET    | `/api/users/:id`       | Single user by ID              |
| GET    | `/api/users/:id/orders`| All orders for a user          |

### Orders
| Method | Endpoint         | Description                       |
|--------|-----------------|-----------------------------------|
| GET    | `/api/orders`    | All orders (page, limit, status)  |
| GET    | `/api/orders/:id`| Single order by ID                |

### Analytics
| Method | Endpoint                      | Description                         |
|--------|------------------------------|-------------------------------------|
| GET    | `/api/analytics/metrics`      | KPI snapshot (hits, misses, latency)|
| GET    | `/api/analytics/timeseries`   | Rolling 30-point time-series        |
| GET    | `/api/analytics/endpoints`    | Top 10 endpoints by request count   |
| GET    | `/api/analytics/cache-entries`| All current L1 cache entries + stats|
| DELETE | `/api/analytics/cache`        | Flush entire L1 in-memory cache     |
| POST   | `/api/analytics/reset`        | Reset all telemetry counters        |

### Simulator
| Method | Endpoint                 | Description                              |
|--------|--------------------------|------------------------------------------|
| GET    | `/api/simulator/endpoints`| Available endpoints for simulation      |
| POST   | `/api/simulator/run`      | Run N requests → returns summary + log  |

**Simulator request body:**
```json
{
  "endpoint": "/api/products",
  "count": 50,
  "delayMs": 100
}
```

**Every cacheable response includes:**
```
X-Cache-Source: L1-LRU | L2-Redis | DB
X-Cache-Latency: 0.14ms
```

---

## 🖥 Frontend Dashboard

### Dashboard
- **4 KPI cards**: Total Requests, Cache Hit Rate, Avg Latency, Cache Memory (MB)
- **Area chart**: Hits vs Misses over time (rolling 30 snapshots)
- **Bar chart**: Average latency per time snapshot
- **Top Endpoints table**: requests, hits, misses, hit rate progress bar, avg latency
- Auto-refreshes every **4 seconds**

### Cache Explorer
- Lists all current L1 LRU entries: key, byte size, TTL remaining, expired state
- Cache stats: size/capacity, total bytes, hit rate, evictions, expirations
- Flush cache button

### Traffic Simulator
- Configure: target endpoint, request count (max 500), delay between requests
- Results: L1 Hits, L2 Hits, DB Fetches, hit rate %, min/max/avg latency
- Bar chart: L1 Hits vs L2 Hits vs DB Fetches
- Request-by-request log table with source badge + latency + HTTP status

### Data Pages
- **Products**: Paginated table + category filter chips + cache source badge
- **Users**: Paginated table + click-to-expand order history (nested cache demo)
- **Orders**: Paginated table + status filter (pending/shipped/delivered/cancelled)

### Sidebar Status Badges (live, poll every 5s)
```
● Backend: online
● MongoDB: connected
● Redis: online (L1+L2)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- Docker Desktop (for Redis)
- MongoDB (local or Atlas — optional, has in-memory fallback)

### 1. Start Redis

```bash
docker run -d --name redis-cache -p 6379:6379 redis:alpine
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env        # edit if needed
npm run dev                  # nodemon, port 5000
```

**Optional — seed MongoDB:**
```bash
npm run seed
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                  # Vite, port 5173
```

### 4. Open

```
http://localhost:5173
```

### Environment Variables (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cacheflow
REDIS_URL=redis://localhost:6379
```

> If MongoDB or Redis is not running, the server **falls back gracefully** — MongoDB → in-memory mock data with artificial delays, Redis → L1-only cache. The system always works.

---

## 📊 Performance Results

Real measurements from the Traffic Simulator (20 requests to `/api/products`):

| Metric          | Value      |
|----------------|-----------|
| Cache Hit Rate  | **95%**   |
| DB Fetch (1st)  | ~191ms     |
| L1 Cache (2nd+) | ~2–5ms     |
| Speedup         | **~50×**  |

### Why LRU?

LRU evicts the **least recently used** entry when capacity is full — perfect for API caches where hot endpoints (e.g. `/api/products`) get repeated requests. An entry accessed 1 second ago is far more likely to be needed again than one accessed 10 minutes ago.

---

## 👤 Author

**Vipul** — CacheFlow Intelligent API Performance Optimization System  
Built as a deep-dive into caching systems, data structures (LRU), and full-stack engineering.
