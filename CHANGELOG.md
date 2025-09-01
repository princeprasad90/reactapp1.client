This file explains how Visual Studio created the project.

The following tools were used to generate this project:
- create-vite

The following steps were used to generate this project:
- Create react project with create-vite: `npm init --yes vite@latest reactapp1.client -- --template=react-ts`.
- Update `vite.config.ts` to set up proxying and certs.
- Add `@type/node` for `vite.config.js` typing.
- Update `App` component to fetch and display weather information.
- Create project file (`reactapp1.client.esproj`).
- Create `launch.json` to enable debugging.
- Add project to solution.
- Update proxy endpoint to be the backend server endpoint.
- Add project to the startup projects list.
- Write this file.

## 2025-09-01

- Add BFF-driven auth wiring in UI (parse `profile_id` from token, dynamic menus via `/api/menus`).
- Update `Login.tsx` to forward `profileId` to BFF on login redirect.
- Update `MainLayout.tsx` to fetch and render menus from BFF.
- Document BFF integration and menus in `README.md` and `docs/auth-bff-jwt.md`.
