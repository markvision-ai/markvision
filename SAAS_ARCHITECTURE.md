# 🏗️ SaaS Architecture - MarkVision AI

## 🎯 Общая архитектура

```
┌───────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                        │
├───────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────┐    ┌──────────────┐   ┌──────────────┐  │
│  │   Auth UI   │───▶│  useAuth()   │──▶│ useProjects()│  │
│  │  /auth      │    │              │   │              │  │
│  └─────────────┘    └──────────────┘   └──────────────┘  │
│         │                  │                    │         │
│         │                  │                    │         │
│         ▼                  ▼                    ▼         │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Supabase Client (RLS Protected)            │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
                           │
                           │ Auth Token + RLS
                           │
┌───────────────────────────────────────────────────────────┐
│                  BACKEND (Supabase)                        │
├───────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │   auth.users     │  │   user_roles     │              │
│  │                  │  │                  │              │
│  │  - id            │  │  - user_id       │              │
│  │  - email         │  │  - role          │              │
│  │  - password      │  │    (admin/       │              │
│  │                  │  │     super_admin) │              │
│  └──────────────────┘  └──────────────────┘              │
│           │                      │                        │
│           │                      │                        │
│           ▼                      ▼                        │
│  ┌────────────────────────────────────────┐              │
│  │        project_access                  │              │
│  │                                        │              │
│  │  - user_id (FK)                        │              │
│  │  - project_id (FK)                     │              │
│  │                                        │              │
│  │  RLS: SELECT WHERE user_id = auth.uid()│              │
│  └────────────────────────────────────────┘              │
│           │                                               │
│           │                                               │
│           ▼                                               │
│  ┌────────────────────────────────────────┐              │
│  │           projects                     │              │
│  │                                        │              │
│  │  - id                                  │              │
│  │  - name                                │              │
│  │  - owner_id                            │              │
│  │                                        │              │
│  │  RLS: SELECT WHERE id IN (             │              │
│  │    SELECT project_id FROM              │              │
│  │    project_access WHERE                │              │
│  │    user_id = auth.uid()                │              │
│  │  )                                     │              │
│  └────────────────────────────────────────┘              │
│           │                                               │
│           │                                               │
│           ▼                                               │
│  ┌────────────────────────────────────────┐              │
│  │     Data Tables (RLS Protected)        │              │
│  │                                        │              │
│  │  - leads                               │              │
│  │  - campaigns                           │              │
│  │  - daily_data                          │              │
│  │  - transactions                        │              │
│  │  - ad_assets                           │              │
│  │  - team_members                        │              │
│  │                                        │              │
│  │  RLS: SELECT WHERE project_id IN (     │              │
│  │    SELECT project_id FROM              │              │
│  │    project_access WHERE                │              │
│  │    user_id = auth.uid()                │              │
│  │  )                                     │              │
│  └────────────────────────────────────────┘              │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

---

## 🔐 Flow новго пользователя

### 1️⃣ Регистрация

```
┌──────────────────────────────────────────────────────────┐
│  User visits /auth                                        │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│  Clicks "Регистрация" tab                                │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│  Enters email: user@example.com                          │
│  Enters password: ******                                 │
│  Clicks "Зарегистрироваться"                             │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│  Supabase creates user in auth.users                     │
│  Returns session token                                   │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│  checkUserProjects(userId)                               │
│    ↓                                                     │
│  SELECT FROM project_access WHERE user_id = ?            │
│    → Result: [] (empty)                                  │
│    ↓                                                     │
│  SELECT FROM user_roles WHERE user_id = ?                │
│    → Result: null (not admin)                            │
│    ↓                                                     │
│  navigate('/setup')                                      │
└──────────────────────────────────────────────────────────┘
```

### 2️⃣ Создание проекта

```
┌──────────────────────────────────────────────────────────┐
│  User on /setup page                                      │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│  Enters project name: "Моя Клиника"                      │
│  Clicks "Создать проект"                                 │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│  INSERT INTO projects (name, owner_id)                   │
│  VALUES ('Моя Клиника', userId)                          │
│  RETURNING id                                            │
│    → projectId: abc-123                                  │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│  INSERT INTO project_access (user_id, project_id)        │
│  VALUES (userId, 'abc-123')                              │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│  navigate('/')                                           │
└──────────────────────────────────────────────────────────┘
```

### 3️⃣ Работа с данными

```
┌──────────────────────────────────────────────────────────┐
│  User opens CRM tab                                       │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│  useLeads(projectId) fires                               │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│  SELECT * FROM leads                                     │
│  WHERE project_id = 'abc-123'                            │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │  RLS Policy checks:                        │         │
│  │  1. Get auth.uid() from session token      │         │
│  │  2. SELECT project_id FROM project_access  │         │
│  │     WHERE user_id = auth.uid()             │         │
│  │  3. Check if 'abc-123' IN results          │         │
│  │  4. ✅ Allow if yes, ❌ Block if no        │         │
│  └────────────────────────────────────────────┘         │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│  Return leads for project 'abc-123'                      │
└──────────────────────────────────────────────────────────┘
```

---

## 🔒 RLS Security Layers

### Layer 1: Frontend
```tsx
// useProjects.ts
if (isAdmin || isSuperAdmin) {
  // Admin bypass
  const { data: allProjects } = await supabase
    .from('projects')
    .select('*');
} else {
  // Regular user
  const { data: accessData } = await supabase
    .from('project_access')
    .select('project_id')
    .eq('user_id', user.id);
}
```

**Защита**: ✅ Пользователь не видит чужие проекты в UI

---

### Layer 2: RLS Policies (Database)

```sql
-- projects table
CREATE POLICY "users_view_accessible_projects"
ON projects FOR SELECT
USING (
  id IN (
    SELECT project_id 
    FROM project_access 
    WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);
```

**Защита**: ✅ Даже если пользователь попытается напрямую запросить чужой проект через API, RLS заблокирует

---

### Layer 3: project_access (Explicit Mapping)

```sql
-- project_access table
user_id              | project_id
---------------------|------------
user-A-id            | project-1
user-A-id            | project-2
user-B-id            | project-3
```

**Защита**: ✅ Явная связь "кто имеет доступ к чему"

---

## 🎭 Сценарии доступа

### Scenario 1: Regular User

```
User A (user-A-id)
├── project_access:
│   ├── ✅ Project 1 (ABC-123)
│   └── ✅ Project 2 (DEF-456)
│
├── Can view:
│   ├── ✅ Leads from Project 1
│   ├── ✅ Leads from Project 2
│   ├── ✅ Campaigns from Project 1
│   └── ✅ Campaigns from Project 2
│
└── CANNOT view:
    ├── ❌ Leads from Project 3
    ├── ❌ Campaigns from Project 3
    └── ❌ ANY data from Project 3
```

### Scenario 2: Admin

```
Admin (admin-user-id)
├── user_roles:
│   └── role: 'admin'
│
├── Can view:
│   ├── ✅ ALL Projects
│   ├── ✅ ALL Leads
│   ├── ✅ ALL Campaigns
│   └── ✅ ALL Data
│
└── Special features:
    ├── ✅ Manage team members
    ├── ✅ Create users
    └── ✅ View system health
```

### Scenario 3: Super Admin (Yuri)

```
Super Admin (d94043b0-1c76-4017-84de-df0dbf00a2c9)
├── user_roles:
│   └── role: 'super_admin'
│
├── Can view:
│   ├── ✅ ALL Projects
│   ├── ✅ ALL Leads
│   ├── ✅ ALL Campaigns
│   └── ✅ ALL Data
│
└── Special features:
    ├── ✅ All admin features
    ├── ✅ "Мои Проекты (Агентство)" tab
    ├── ✅ Force load project (debug)
    └── ✅ View agency finances
```

---

## 🔄 Project Switcher Flow

```
┌────────────────────────────────────────────────────────┐
│  User clicks Project Dropdown in Sidebar               │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  Shows list of projects from useProjects()             │
│                                                        │
│  For Regular User:                                     │
│  ┌──────────────────────────────────────┐             │
│  │  SELECT p.* FROM projects p          │             │
│  │  WHERE p.id IN (                     │             │
│  │    SELECT project_id FROM            │             │
│  │    project_access                    │             │
│  │    WHERE user_id = current_user      │             │
│  │  )                                   │             │
│  └──────────────────────────────────────┘             │
│                                                        │
│  For Admin:                                            │
│  ┌──────────────────────────────────────┐             │
│  │  SELECT * FROM projects              │             │
│  │  ORDER BY created_at DESC            │             │
│  └──────────────────────────────────────┘             │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  User selects "Project 2"                              │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  setCurrentProjectId('project-2-id')                   │
│  localStorage.setItem('markvision-current-project',    │
│                       'project-2-id')                  │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  ALL hooks re-run with new projectId:                  │
│    ↓                                                   │
│  useLeads('project-2-id')                              │
│  useCampaigns('project-2-id')                          │
│  useProjectData('project-2-id')                        │
│  useAdAssets('project-2-id')                           │
│    ↓                                                   │
│  UI updates with data from Project 2                   │
└────────────────────────────────────────────────────────┘
```

---

## 🛡️ Security Guarantee

### Question: Can User A see User B's data?

**Answer: NO** ❌

**Reason:**

1. **Frontend Level**:
```tsx
// useProjects only loads projects from project_access
const { data: accessData } = await supabase
  .from('project_access')
  .select('project_id')
  .eq('user_id', user.id);
// User A's ID !== User B's ID
// Therefore, different projects
```

2. **Database Level (RLS)**:
```sql
-- Even if User A tries to hack the API:
SELECT * FROM leads WHERE project_id = 'user-b-project-id';

-- RLS Policy blocks it:
-- project_id NOT IN (
--   SELECT project_id FROM project_access WHERE user_id = 'user-a-id'
-- )
-- → Returns 0 rows
```

3. **project_access Level**:
```
project_access table:
user-a-id | project-a-id  ✅
user-a-id | project-b-id  ❌ (doesn't exist)
user-b-id | project-b-id  ✅
```

### Question: Can I bypass RLS?

**Answer: NO** ❌

**Reason:**
- RLS is enforced at the PostgreSQL level
- Even Supabase Admin Panel respects RLS
- Only `service_role` key can bypass (not used in frontend)
- `anon` and `authenticated` keys always respect RLS

---

## 📊 Data Isolation Visualization

```
┌─────────────────────────────────────────────────────────┐
│                      DATABASE                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ╔═══════════════════════════════════════════╗          │
│  ║  Project A (Клиника "Медицина")           ║          │
│  ╠═══════════════════════════════════════════╣          │
│  ║  - 10 leads                               ║          │
│  ║  - 5 campaigns                            ║          │
│  ║  - $5000 revenue                          ║          │
│  ╚═══════════════════════════════════════════╝          │
│         │                                                │
│         │ project_access:                                │
│         │ user_id: user-A-id                             │
│         ▼                                                │
│  ┌──────────────┐                                        │
│  │   User A     │ ✅ Can view Project A data            │
│  └──────────────┘                                        │
│                                                          │
│  ╔═══════════════════════════════════════════╗          │
│  ║  Project B (Клиника "Здоровье")          ║          │
│  ╠═══════════════════════════════════════════╣          │
│  ║  - 25 leads                               ║          │
│  ║  - 12 campaigns                           ║          │
│  ║  - $12000 revenue                         ║          │
│  ╚═══════════════════════════════════════════╝          │
│         │                                                │
│         │ project_access:                                │
│         │ user_id: user-B-id                             │
│         ▼                                                │
│  ┌──────────────┐                                        │
│  │   User B     │ ✅ Can view Project B data            │
│  └──────────────┘                                        │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │  User A tries: SELECT * FROM leads         │         │
│  │                WHERE project_id = 'B'      │         │
│  │                                            │         │
│  │  RLS: ❌ BLOCKED                           │         │
│  │  Reason: Project B NOT IN project_access  │         │
│  │          for user-A-id                     │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Summary

### ✅ Implemented:
- **Multi-tenancy** через `project_access`
- **RLS policies** на уровне БД
- **Project Switcher** с изоляцией данных
- **Admin roles** с полным доступом
- **Auth UI** с переключателем
- **Onboarding** для новых пользователей

### 🔒 Security:
- **3 layers** защиты (Frontend, RLS, project_access)
- **Impossible** для пользователя увидеть чужие данные
- **Admin/Super Admin** имеют явные права
- **RLS enforced** на уровне PostgreSQL

### 🚀 Ready for Production:
- ✅ SaaS architecture
- ✅ Data isolation
- ✅ Role-based access
- ✅ Onboarding flow
- ✅ Multi-project support

---

**Архитектор**: Yuri  
**Дата**: 22 января 2026  
**Статус**: ✅ Production Ready
