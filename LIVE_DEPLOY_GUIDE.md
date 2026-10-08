# 🚀 ChatConnect — Live Upload & Mobile Setup Guide
## લાઇવ અપલોડ અને મોબાઇલ યુઝ ગાઇડ (Live Deployment & Mobile Access)

હવે મોબાઇલ નંબર કે SMS OTP વગર કોઈપણ વ્યક્તિ ફક્ત Username/Email અને Password થી સીધું રજીસ્ટ્રેશન અને લોગીન કરી શકે છે.

આ એપ્લિકેશન તમામ મોબાઇલ બ્રાઉઝર્સ (Chrome, Safari, Firefox, Opera) માં 100% WhatsApp જેવો responsive native-app લૂક આપે છે.

---

## 📱 મોબાઇલ પર કેવી રીતે ઉપયોગ કરવો (Mobile Experience)

1. **સ્લાઇડિંગ નેવિગેશન (WhatsApp Mobile UX)**:
   - મોબાઇલમાં ચેટ લિસ્ટ દેખાશે.
   - કોઈપણ ચેટ પર ક્લિક કરતાં WhatsApp ની જેમ ડાબી બાજુથી ચેટ સ્લાઇડ થઈને ઓપન થશે.
   - ચેટ હેડરમાં રહેલા **`<` (Back Arrow)** પર ટેપ કરતાં તરત જ ફરી ચેટ લિસ્ટમાં પાછા આવી જશો.
2. **ઇન્સ્ટન્ટ પ્રોફાઇલ ફોટો (Avatar Presets)**:
   - રજીસ્ટ્રેશન વખતે મોબાઇલ પર કોઈપણ ફોટો URL કોપી-પેસ્ટ કર્યા વગર 1-ટેપમાં મનપસંદ અવતાર પસંદ કરી શકાય છે.
3. **iPhone Notch & Home Bar Compatibility**:
   - iOS Safari અને Android ના safe-area insets અને `100dvh` લાગુ કરાયા છે જેથી કિબોર્ડ ઓપન થાય ત્યારે ઇનપુટ બોક્સ કપાઈ ન જાય.
4. **ઝૂમ પ્રોટેક્શન (No Auto-Zoom)**:
   - મોબાઇલમાં ટાઇપ કરતી વખતે સ્ક્રીન આપોઆપ અનિચ્છનીય રીતે ઝૂમ નહીં થાય.

---

## 🌐 ફ્રીમાં લાઈવ અપલોડ કરવાની સરળ રીતો (Free Live Deployment Options)

### રીત ૧: Render.com પર એક જ સર્વિસમાં પૂરી એપ અપલોડ કરો (સૌથી સરળ - Recommended)

Render.com ફ્રી હોસ્ટિંગ આપે છે જ્યાં Frontend, Backend અને WebSockets ત્રણેય 1 જ સર્વર પર ચાલે છે!

#### પગલું ૧: GitHub પર કોડ અપલોડ કરો
1. Git repo બનાવો અને આ પ્રોજેક્ટ GitHub પર પુશ કરો:
   ```bash
   git init
   git add .
   git commit -m "ChatConnect ready for live deployment"
   git branch -M main
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/chatconnect.git
   git push -u origin main
   ```

#### પગલું ૨: ફ્રી MongoDB ડેટાબેઝ બનાવો (MongoDB Atlas)
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) પર ફ્રી અકાઉન્ટ બનાવો.
2. ફ્રી **M0 Cluster** બનાવો.
3. Database User બનાવો (Username & Password યાદ રાખો).
4. **Network Access** માં `0.0.0.0/0` (Allow Access from Anywhere) એડ કરો.
5. **Connect** પર ક્લિક કરી Connection String કોપી કરો:
   `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/chatconnect?retryWrites=true&w=majority`

#### પગલું ૩: Render.com પર Deploy કરો
1. [Render.com](https://render.com) પર જાઓ અને ફ્રી અકાઉન્ટ બનાવો.
2. **New +** -> **Web Service** પસંદ કરો.
3. તમારી GitHub repository કનેક્ટ કરો.
4. નીચે મુજબ સેટિંગ્સ ભરો:
   - **Name**: `my-chatconnect` (અથવા તમારી પસંદનું નામ)
   - **Region**: Singapore / Frankfurt / Oregon
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm --prefix server install && npm --prefix client install && npm --prefix client run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Instance Type**: `Free`
5. **Environment Variables** (Add Environment Variables):
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `JWT_SECRET`: `my_super_secret_jwt_key_2025`
   - `MONGODB_URI`: (તમારી MongoDB Atlas connection string)
6. **Create Web Service** પર ક્લિક કરો!
7. થોડી મિનિટોમાં Render તમારી એપ લાઈવ કરી દેશે. તમને લિંક મળશે, જેમ કે:
   `https://my-chatconnect.onrender.com`
8. આ લિંક તમે તમારા મોબાઇલમાં કે મિત્રો સાથે શેર કરીને સીધું ચેટિંગ શરૂ કરી શકો છો!

---

### રીત ૨: Vercel (Frontend) + Render/Railway (Backend)

જો તમારે Frontend Vercel પર અને Backend Render/Railway પર રાખવું હોય:

1. **Backend (Render / Railway)**:
   - Root directory: `server`
   - Start command: `node server.js`
   - Environment variables: `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`
   - Backend URL મળશે: `https://my-chat-api.onrender.com`

2. **Frontend (Vercel)**:
   - Root directory: `client`
   - Build command: `vite build`
   - Output directory: `dist`
   - Environment variables:
     - `VITE_API_URL`: `https://my-chat-api.onrender.com/api`
     - `VITE_SOCKET_URL`: `https://my-chat-api.onrender.com`
   - Vercel URL મળશે: `https://my-chat.vercel.app`

---

## 💻 લોકલ કમ્પ્યુટરમાં ટેસ્ટ કરવા માટે (Local Testing)

૧. સર્વર ચાલુ કરો:
```bash
npm run server
```

૨. ક્લાયન્ટ ચાલુ કરો:
```bash
npm run client
```

૩. બ્રાઉઝરમાં ખોલો:
`http://localhost:5173`

૪. "Create an account" પર ક્લિક કરીને તમારું નવું એકાઉન્ટ બનાવી લોગીન કરો!
