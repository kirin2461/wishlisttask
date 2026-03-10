# 🎁 Wishlist App

A beautiful social wishlist application with group gifting, real-time updates, and stunning animations.

![App Icon](wishlist-icon.png)

## ✨ Features

- 🎨 **Stunning Design** - Beautiful gradients, animations, and visual effects
- 🎁 **Create Wishlists** - For birthdays, weddings, holidays, or any occasion
- 🔗 **Share with Friends** - Unique public links for each wishlist
- 🤫 **Anonymous Reservations** - Friends can reserve gifts without spoiling the surprise
- 👥 **Group Gifting** - Multiple friends can contribute to expensive gifts
- ⚡ **Real-time Updates** - See reservations and contributions instantly
- 📱 **Responsive** - Works perfectly on desktop and mobile
- 🎊 **Celebration Effects** - Confetti and animations for special moments

## 🚀 Quick Start

### Option 1: One-Click Launch (Recommended)

```bash
# Clone or download the project
cd wishlist-app

# Run the launcher
./start.sh
```

The script will:
- ✅ Check prerequisites
- ✅ Install dependencies automatically
- ✅ Start backend server (http://localhost:8000)
- ✅ Start frontend dev server (http://localhost:5173)
- ✅ Open your browser automatically

### Option 2: Install Desktop Shortcut

```bash
./install.sh
```

This creates a desktop entry so you can launch the app from your applications menu!

## 📋 Prerequisites

- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)

## 🛠️ Manual Setup

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python3 main.py
```

Backend will run at: http://localhost:8000

### Frontend

```bash
cd app
npm install
npm run dev
```

Frontend will run at: http://localhost:5173

## 🎯 How to Use

1. **Register/Login** - Create an account or sign in
2. **Create a Wishlist** - Click "New Wishlist" and fill in details
3. **Add Items** - Add gifts with title, price, image, and link
4. **Share** - Copy the public link and share with friends
5. **Friends Reserve** - They can reserve or contribute without you knowing who

## 🎨 Design Features

### Animations
- Floating gift icons
- Particle background effects
- Smooth page transitions
- Hover effects on all interactive elements
- Confetti celebrations
- Ripple effects on buttons
- Pulsing glow effects

### Visual Effects
- Glassmorphism cards
- Gradient backgrounds
- Animated sparkles
- Shimmer loading effects
- Progress bar animations

## 🏗️ Project Structure

```
wishlist-app/
├── 📁 app/                    # Frontend (React + TypeScript)
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   ├── 📁 animations/     # Animation components
│   │   │   │   ├── AnimatedGift.tsx
│   │   │   │   ├── AnimatedButton.tsx
│   │   │   │   ├── AnimatedCard.tsx
│   │   │   │   ├── Confetti.tsx
│   │   │   │   └── ParticleBackground.tsx
│   │   │   └── 📁 ui/             # shadcn/ui components
│   │   ├── 📁 contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── 📁 hooks/
│   │   │   └── useWebSocket.ts
│   │   ├── 📁 pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── 📁 lib/
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   └── App.tsx
│   └── package.json
│
├── 📁 backend/                # Backend (FastAPI)
│   ├── main.py
│   └── requirements.txt
│
├── 🖼️ wishlist-icon.png       # App icon
├── 🚀 start.sh                # Launch script
├── 📦 install.sh              # Install desktop shortcut
└── 📖 README.md               # This file
```

## 🔧 Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **shadcn/ui** - UI components
- **Axios** - HTTP client

### Backend
- **FastAPI** - Python web framework
- **JWT** - Authentication
- **WebSockets** - Real-time updates
- **Passlib** - Password hashing

## 🌟 Key Features Explained

### Anonymous Reservations
When someone reserves a gift, the wishlist owner sees "Reserved" but not who reserved it. This keeps the surprise!

### Group Gifting
For expensive items, friends can contribute any amount. A progress bar shows how much has been raised.

### Real-time Updates
Using WebSockets, all connected users see updates instantly - no page refresh needed!

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create account |
| `/api/auth/login` | POST | Sign in |
| `/api/wishlists` | GET/POST | List/Create wishlists |
| `/api/items` | POST | Add item |
| `/api/reservations` | POST | Reserve item |
| `/api/contributions` | POST | Contribute to group gift |
| `/api/public/wishlists/{slug}` | GET | Public wishlist view |
| `/ws/{wishlist_id}` | WS | Real-time updates |

## 🎉 Celebration Effects

The app includes celebration animations that trigger on:
- ✅ Successful login/registration
- ✅ New wishlist created
- ✅ Item added
- ✅ Gift reserved
- ✅ Contribution made

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill processes on ports 5173 or 8000
lsof -ti:5173 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

### Dependencies issues
```bash
# Clear and reinstall
cd app && rm -rf node_modules && npm install
cd backend && rm -rf venv && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
```

## 📄 License

MIT License - feel free to use and modify!

---

Made with 💜 and lots of ✨ animations!
