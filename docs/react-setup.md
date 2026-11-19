# React Project Setup Using Vite — Windows

## Step 1: Verify Node.js and npm

```powershell
node -v
npm -v
```

**Purpose:** Check that Node.js and npm are installed and working.

My versions:
- Node.js: `v24.19.0`
- npm: `11.17.0`

## Step 2: Check the project folder

```powershell
Get-ChildItem -Force
```

**Purpose:** View files and folders, including hidden items, before creating the project.

## Step 3: Create the React project

```powershell
npm create vite@latest . -- --template react
```

**Purpose:** Create a React project using Vite in the current folder.

- `npm create`: Runs a project generator.
- `vite@latest`: Uses the latest Vite generator.
- `.`: Uses the current directory.
- `--template react`: Selects the React JavaScript template.

## Step 4: Choose the setup options

- Package name: `exoflora-website`
- Linter: `ESLint`
- Install with npm and start now: `Yes`

## Step 5: Installation result

Vite created the project and installed its dependencies.

## Step 6: Start the development server

The local website runs at the address shown by Vite, usually:

`http://localhost:5173/`

Keep the terminal open while developing.