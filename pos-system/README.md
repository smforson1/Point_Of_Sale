# 🚀 Premium POS System - Production-Ready

A high-performance, production-grade Point of Sale (POS) system built with **Next.js 15**, **TypeScript**, and **Supabase**. This system is designed for modern retail and hospitality businesses, featuring AI-powered insights, offline resilience, and specialized hardware support.

## ✨ Key Features

### 🛒 Point of Sale (POS)
- **Fluid Checkout Experience**: Ultra-responsive cart system with smooth animations and auto-scrolling.
- **Hardware Integration**: Global HID barcode scanner support and ESC/POS thermal printer optimization.
- **Offline Resilience**: Seamless offline sales processing using Dexie.js (IndexedDB) with automatic background sync.
- **Hybrid Cart**: Supports parked/held orders, split payments, and digital receipts (WhatsApp/Email).

### 🤖 AI Business Insights
- **AI Consultant**: Exclusive Admin/Manager chat assistant powered by **Gemini 2.5 Flash** with deep financial context.
- **Data Analytics**: Real-time sales trends, profit forecasts, and "Dead Stock" alerts using AI-driven inventory analysis.

### 📦 Inventory & Products
- **Smart Management**: Low stock alerts with real-time browser notifications.
- **Image Support**: Dual-mode handling with direct Supabase Storage uploads and external URL rendering.
- **Product Variants**: Full support for color, size, and other variation types with shared stock tracking.

### 👥 Customer & CRM
- **Loyalty Program**: Tiered reward system (Bronze, Silver, Gold) with balance tracking.
- **Coupon System**: Advanced discount engine supporting both percentage and fixed-amount promo codes.

### 📑 Reports & Management
- **Shift Control**: Cashier shift management with detailed X and Z reports.
- **Financial Tracking**: Built-in expense management and net profit calculations.
- **Audit Logs**: Comprehensive activity tracking for secure operations.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI, Lucide Icons
- **State Management**: Zustand
- **Backend**: Supabase (Auth, PostgreSQL, Realtime, Storage)
- **Local DB**: Dexie.js (IndexedDB for offline mode)
- **AI Engine**: Google Gemini 2.1 Flash
- **Forms & Validation**: React Hook Form, Zod

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Supabase Project (with Storage bucket named `products`)
- Google Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/smforson1/Point_Of_Sale.git
   cd Point_Of_Sale/pos-system
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to start using the system.

## 🛡️ License

This project is licensed under the MIT License.
