## Feature Request: Provider Sharing & Role-Based Access Control

### Objective

Implement a sharing mechanism that allows a **Super Admin** to share provider data (website URLs and API tokens) with designated members who have **read-only access**.

---

### Requirements

#### 1. Role Definitions

- **Super Admin (Owner)**

  - Full CRUD access to all providers
  - Ability to share/unshare providers with other members
  - Control over visibility toggles for shared data

- **Member (Read-Only)**
  - Can view shared provider website URLs and API tokens
  - Cannot create, edit, or delete providers
  - Cannot modify sharing settings

#### 2. Sharing Functionality

- Super Admin can toggle which providers are visible to members
- Shared data includes:
  - Provider website URL
  - API tokens associated with the provider
- Members can only access providers explicitly shared with them

#### 3. Account Configuration

- The primary account holder is designated as **Super Admin**
- Secondary accounts (e.g., friend's account) are assigned **Member** role by default

---

### Constraints

- Do not expose sensitive data to unauthorized users
- Maintain existing provider management functionality for Super Admin
- Member accounts must not have write permissions under any circumstance

---

### Acceptance Criteria

- [ ] Super Admin can toggle provider visibility for members
- [ ] Members can view shared provider URLs and API tokens
- [ ] Members cannot perform any write operations on providers
- [ ] Role assignment persists across sessions
