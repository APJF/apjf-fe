# Copilot Instructions for apjf-fe

## Project Overview
- This is a React + TypeScript frontend using Vite and Tailwind CSS.
- Source code is in `src/`, with major domains organized by feature (e.g., `components/course/`, `pages/`, `services/`).
- API communication is handled via service modules in `src/services/` using Axios.
- User authentication state is managed via `useAuth` hook and localStorage, with custom events for cross-tab sync.

## Key Patterns & Conventions
- **Component Structure:**
  - UI and logic are separated: UI in `components/`, page logic in `pages/`, API/data in `services/`.
  - Use hooks from `src/hooks/` for shared logic (e.g., `useAuth`).
- **API Services:**
  - All API calls go through `src/services/*Service.ts` files.
  - Use Axios instance from `api/axios.ts` for requests.
- **Types:**
  - Shared types/interfaces are in `src/types/`.
- **State Management:**
  - No global state library; use React context/hooks and localStorage as needed.
- **Routing:**
  - App routes are defined in `src/router/AppRouter.tsx`.
- **Assets:**
  - Images and static files are in `public/` and `src/assets/`.

## Developer Workflows
- **Install dependencies:** `npm install`
- **Start dev server:** `npm run dev`
- **Build for production:** `npm run build`
- **Preview production build:** `npm run preview`
- **Lint:** `npm run lint`
- **No test scripts are defined by default.**

## Integration Points
- **Authentication:**
  - Login/logout/profile handled via `authService` and `useAuth`.
  - User info is stored in localStorage under `user` key.
  - Custom `authStateChanged` event is dispatched on login/logout for cross-tab updates.
- **API:**
  - All backend communication uses Axios; base config in `src/api/axios.ts`.

## Examples
- To add a new API call, create a method in the relevant `*Service.ts` and define types in `src/types/`.
- To add a new page, create a component in `pages/` and add a route in `AppRouter.tsx`.

## References
- See `src/hooks/useAuth.ts` for authentication pattern.
- See `src/services/` for API integration examples.
- See `vite.config.ts` and `tailwind.config.js` for build and styling setup.
