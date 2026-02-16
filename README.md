# SAMS | Security Agency Management System


**SAMS (Security Agency Management System)** is a production-grade, multi-tenant SaaS platform designed to streamline operations for security agencies. It provides a robust, secure, and premium experience for managing personnel, clients, projects, attendance, and payroll.

---

## 🚀 Vision & Key Features

SAMS is built with three core pillars: **Security**, **Scalability**, and **Simplicity**.

### 🔐 Advanced Multi-Tenancy & Security
- **Portal Isolation**: Dedicated login portals for Super Admins, Agency Admins, and Operational Staff.
- **Tenant Data Shield**: Strict `agencyId` scoping at the database and API level ensures cross-agency data leaks are impossible.
- **Hierarchical RBAC**: Granular permission system based on designations (Guard, Supervisor, HR, etc.).

### 🏢 Agency Administration
- **Personnel Onboarding**: Simplified staff registration with automatic role assignment.
- **Client & Project Management**: Manage institutional contracts and link them to operational sites.
- **Dynamic RBAC Dashboard**: Real-time permission mapping for agency-specific roles.

### 📅 Operational Excellence
- **Attendance System**: Project-locked check-in/out with multi-method support.
- **Intelligent Leave Management**: 
  - Hierarchical approval flow (Supervisor → HR → Admin).
  - **Emergency Flow**: Automatic approval with post-action audit acceptance.
  - **Dynamic Skipping**: System automatically redirects requests if an approver is on leave.

### 💰 Financial Management
- **Payroll Engine**: Generate bulk or individual payroll records with automated net pay calculations.
- **Audit Trails**: Critical actions are logged with severity levels for compliance and transparency.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Styling**: Tailwind CSS & [Shadcn/UI](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [Zustand](https://docs.pmnd.rs/zustand/)
- **API Client**: Axios with global interceptors for resilient auth handling.

### Backend
- **Framework**: [NestJS](https://nestjs.com/) (Node.js)
- **Database**: PostgreSQL
- **ORM**: [Prisma](https://www.prisma.io/)
- **Security**: Passport.js (JWT & Local strategies), bcrypt-hashed credentials.

---

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL Instance
- NPM or PNPM

### 1. Clone the Repository
```bash
git clone https://github.com/owais1724/sams.git
cd sams
```

### 2. Backend Configuration
```bash
cd backend
npm install
```
Create a `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/sams_db"
JWT_SECRET="your_secure_secret"
PORT=3000
```
Initialize Database:
```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

### 3. Frontend Configuration
```bash
cd ../frontend
npm install
```
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### 4. Launch
```bash
# In backend folder
npm run start:dev

# In frontend folder
npm run dev
```

---

## 🐳 Run with Docker (Recommended)

The easiest way to get SAMS up and running is using Docker Compose.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Steps
1. **Clone & Enter**:
   ```bash
   git clone https://github.com/owais1724/security-agency-management-system.git
   cd security-agency-management-system
   ```

2. **Spin Up**:
   ```bash
   docker-compose up --build -d
   ```

3. **Access**:
   - **Frontend**: `http://localhost:3001`
   - **Backend API**: `http://localhost:3000`
   - **Database**: PostgreSQL on port `5432`

The system will automatically apply database migrations and seed the initial data on startup.


---

## 🛡 Security Architecture

SAMS utilizes a **Bulletproof API Interceptor** layer to handle authentication:
- **Auto-Dismissal**: Previous error states are cleared instantly upon new attempts.
- **Race Condition Prevention**: Explicit token handoff during login sequences.
- **Session Protection**: Automatic global logout and token purging on 401 Unauthorized detection.

---

## 📄 License

This project is proprietary and intended for professional security agency operations.

---

*Built with ❤️ for the Global Security Ecosystem.*
