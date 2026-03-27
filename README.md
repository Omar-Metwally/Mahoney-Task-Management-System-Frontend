# 🗂️ Mahoney Task System

A robust, enterprise-grade task management platform built with **.NET 10** and **Angular 21** — designed around Clean Architecture, Domain-Driven Design, and a clear role-based permission model.

---

## 📌 Overview

Mahoney Task System is a full-stack task management solution that supports structured, role-driven workflows across organizations. It enables admins to manage departments and users, managers to oversee their teams, and employees to track and update their assigned tasks — all through a responsive, mobile-friendly interface.

---

## 🔐 Role-Based Permissions

| Capability                        | Admin | Manager | Employee |
|-----------------------------------|:-----:|:-------:|:--------:|
| Add / manage departments          | ✅    | ❌      | ❌       |
| Add / manage employees            | ✅    | ❌      | ❌       |
| Create tasks (global)             | ✅    | ❌      | ❌       |
| View department employees         | ✅    | ✅      | ❌       |
| Create tasks (own department)     | ✅    | ✅      | ❌       |
| View assigned tasks               | ✅    | ✅      | ✅       |
| Update own task status            | ✅    | ✅      | ✅       |

---

## 🏗️ Architecture

### Backend — .NET 10

The backend follows **Clean Architecture** with strict dependency rules to enforce separation of concerns:

```
┌──────────────────────────────────────────────────┐
│                    WebAPI                        │  ← depends on Core + Domain
├──────────────────────────────────────────────────┤
│         Identity         │      Persistence      │  ← depend on Core + Domain
├──────────────────────────────────────────────────┤
│                    Core                          │  ← depends on Domain only
├──────────────────────────────────────────────────┤
│                   Domain                         │  ← no dependencies
└──────────────────────────────────────────────────┘
```

- **Domain** — Pure domain logic, entities, value objects, and domain events. Zero external dependencies.
- **Core** — Application logic, interfaces, use cases. Depends only on Domain.
- **Identity** — Authentication and authorization. Depends on Core + Domain.
- **Persistence** — Database access and repositories. Depends on Core + Domain.
- **WebAPI** — HTTP layer, controllers, middleware. Depends on Core + Domain.

---

## ⚙️ Key Technical Features

### Domain-Driven Design (DDD)
Domain entities are created exclusively via the **Factory Method** pattern, ensuring invariants are always enforced at construction time.

### CQRS with MediatR
Commands and queries are fully separated using [MediatR](https://github.com/jbogard/MediatR), keeping read and write models independent and scalable.

### Result Pattern
All application methods return a `Result` type instead of throwing exceptions. Errors are treated as first-class citizens in the control flow, making error handling explicit, predictable, and composable.

### Outbox Pattern (Ready)
Infrastructure support for the **Outbox Pattern** is in place, enabling reliable domain event publishing and eventual consistency without coupling domain logic to messaging infrastructure.

### Logging — Two Levels

| Level | What it logs | Where |
|-------|-------------|-------|
| **Request Log** | Every incoming request + authenticated user | Plain `.txt` log file |
| **Database Changelog** | Every data mutation — who changed what, in which table | `DatabaseChangelog` table in the DB |

---

## 🎨 Frontend — Angular 21

The Angular frontend is built with a strong focus on **usability** and **responsiveness**, delivering a seamless experience on both desktop and mobile devices.

- Component-driven architecture following Angular best practices
- Responsive layouts that adapt across screen sizes
- Role-aware UI — components and routes are conditionally rendered based on the authenticated user's role
- Clean separation between feature modules for Admin, Manager, and Employee views

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| .NET SDK | 10.x |
| Node.js | 22.x+ |
| Angular CLI | 21.x |
| SQL Server | 2019+ (or compatible) |

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/your-org/mahoney-task-system.git

# Restore dependencies
dotnet restore

# Apply database migrations
dotnet ef database update  --project MahoneyTaskManagementSystem.Infrastructure --startup-project MahoneyTaskManagementSystem.WebApi

# Run the API
dotnet run --project src/WebAPI
```

### Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start the development server
ng serve
```

The API will be available at `http://localhost:5294` and the frontend at `http://localhost:4200`.

Demo `https://mahoney-49e00.web.app`