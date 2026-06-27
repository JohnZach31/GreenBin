# GreenBin

GreenBin is a web application for identifying recyclable items from images and helping users understand how to recycle them correctly.

The project includes a frontend interface, a backend API, and machine learning folders for model-related logic and experiments. It also includes a recycling queue flow, allowing users to build a recycling plan from multiple uploaded photos.

---

## Project Overview

GreenBin helps users:

- Upload or capture images of waste items.
- Analyze whether an item is recyclable.
- Receive recycling guidance.
- Add multiple items into a recycling queue.
- Build a practical recycling plan from several photos.
- Use a multi-city recycling dataset for more location-aware recycling logic.

The goal of the project is to make recycling decisions easier, faster, and more accessible through a simple web interface.

---

## Main Features

### Image Upload

Users can upload an image of an item they want to recycle.

### Image Analysis

The app sends the image to the backend, where it can be processed and classified.

### Recycling Queue

Users can add multiple items to a queue and manage a recycling plan instead of analyzing only one item at a time.

### Multi-City Dataset Support

The backend includes dataset-related logic that can support recycling rules across different cities.

### Manual Search

Users can manually search for recycling information when they do not want to upload an image.

### Camera Flow

The frontend supports a camera-based flow for taking item photos directly.

---

## Project Structure

```txt
GreenBin/
│
├── backend/
│   ├── data/
│   ├── node_modules/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   ├── temp/
│   ├── uploads/
│   ├── .env
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── frontend/
│   ├── node_modules/
│   ├── package.json
│   ├── package-lock.json
│   └── ...
│
├── ml-huggingface/
│   └── ...
│
├── ml-ourmodel/
│   └── ...
│
├── docs/
│   └── ...
│
├── .gitignore
└── README.md
```

---

## Technologies Used

### Frontend

- React
- Vite
- JavaScript
- HTML
- CSS

### Backend

- Node.js
- Express.js
- File upload handling
- Local dataset and service logic

### Machine Learning

The repository includes ML-related folders for different model approaches:

- `ml-huggingface/`
- `ml-ourmodel/`

These folders are used for model experiments, prediction logic, or future model integration.

---

## Requirements

Before running the project, install:

- Node.js
- npm, which comes with Node.js
- Git

Recommended versions:

```txt
Node.js 18+
npm 9+
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/JohnZach31/GreenBin.git
cd GreenBin
```

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

Return to the project root:

```bash
cd ..
```

---

## Running the Project Manually

You need two terminals: one for the backend and one for the frontend.

---

### Terminal 1: Start the Backend

From the project root:

```bash
cd backend
node server.js
```

The backend should start and print a message showing that the server is running.

Example:

```txt
Server running on port 5000
```

The exact port may depend on the backend configuration.

---

### Terminal 2: Start the Frontend

From the project root:

```bash
cd frontend
npm run dev
```

Vite will start the frontend and show a local URL.

Example:

```txt
http://localhost:5173
```

Open that URL in the browser.

---

## Running the Project with `start.bat`

For Windows users, the project can be launched using a `start.bat` file from the root folder.

Create a file named:

```txt
start.bat
```

Paste this inside:

```bat
@echo off
title GreenBin Launcher

cd /d "%~dp0"

echo Starting GreenBin...
echo.

REM Get local IPv4 address for phone testing
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    goto got_ip
)

:got_ip
set IP=%IP: =%

REM Start backend
start "GreenBin Backend" cmd /k "cd backend && node server.js"

timeout /t 3 /nobreak > nul

REM Start frontend with network access
start "GreenBin Frontend" cmd /k "cd frontend && npm run dev -- --host 0.0.0.0"

timeout /t 6 /nobreak > nul

echo Open on PC:
echo http://localhost:5173
echo.
echo Open on phone:
echo http://%IP%:5173
echo.
echo Make sure your phone and PC are connected to the same Wi-Fi network.
echo.

REM Open app on PC
start http://localhost:5173

pause
```

Then run:

```bash
start.bat
```

This will:

1. Start the backend.
2. Start the frontend.
3. Open the app in the browser.
4. Print a phone-accessible URL.

---

## Optional: `install.bat`

You do not need to run `npm install` every time.

Use `npm install` only when:

- You cloned the repository for the first time.
- Someone changed `package.json`.
- Someone changed `package-lock.json`.
- You deleted `node_modules`.
- Dependencies are broken.

For convenience, you can create an `install.bat` file:

```bat
@echo off
title GreenBin Installer

cd /d "%~dp0"

echo Installing backend dependencies...
cd backend
npm install

echo.
echo Installing frontend dependencies...
cd ..\frontend
npm install

echo.
echo Installation complete.
pause
```

Recommended flow:

```txt
install.bat   -> run only when dependencies change
start.bat     -> run every time you want to start the app
```

---

## Accessing the App from a Phone

To test the app from a phone:

1. Make sure the computer and phone are on the same Wi-Fi network.
2. Run `start.bat`.
3. Look for the printed phone URL.

Example:

```txt
http://192.168.1.47:5173
```

4. Open that URL on the phone browser.

The frontend is started with:

```bash
npm run dev -- --host 0.0.0.0
```

This allows other devices on the same network to access the Vite development server.

If the frontend opens on the phone but backend requests fail, the backend may also need to listen on all network interfaces.

In `backend/server.js`, the backend can be configured like this:

```js
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Environment Variables

The backend contains a `.env` file.

Example variables may include:

```env
PORT=5000
```

Do not commit private keys, API tokens, passwords, or sensitive configuration values to GitHub.

The `.env` file should usually be listed in `.gitignore`.

---

## Basic Demo Flow

A typical project demo can show:

1. Open the GreenBin web app.
2. Upload or capture an image of a waste item.
3. Run the analysis.
4. Show the predicted recycling result.
5. Add the item to the recycling queue.
6. Upload or capture another item.
7. Show how the queue builds a recycling plan.
8. Demonstrate manual search.
9. Explain how the backend and dataset support the result.

---

## Git Workflow

Before pulling new updates, check your current state:

```bash
git status
```

If you have local changes, commit them:

```bash
git add .
git commit -m "Save current work"
```

Then pull updates from the branch:

```bash
git pull origin backend-api
```

To push your changes:

```bash
git add .
git commit -m "Update README and startup scripts"
git push origin backend-api
```

---

## Branch Notes

The project currently uses multiple branches.

The `backend-api` branch includes backend work and updated frontend changes.

To switch to the branch:

```bash
git checkout backend-api
```

To pull the newest version:

```bash
git pull origin backend-api
```

---

## Troubleshooting

### Backend says `app.py` does not exist

This project uses a Node backend, not a Python Flask backend.

Use:

```bash
cd backend
node server.js
```

Do not use:

```bash
python app.py
```

---

### Frontend does not start

Try:

```bash
cd frontend
npm install
npm run dev
```

---

### Backend does not start

Try:

```bash
cd backend
npm install
node server.js
```

---

### Phone cannot open the app

Check that:

- Phone and PC are on the same Wi-Fi.
- Frontend is running with `--host 0.0.0.0`.
- Windows Firewall allows Node.js.
- You are using the local IPv4 address printed by `start.bat`.

---

### API calls fail from phone

The backend may be listening only on `localhost`.

Update the backend listener in `server.js`:

```js
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
```

Also make sure the frontend API URL is not hardcoded only to `localhost` if the app is being used from a phone.

---

## Future Improvements

Possible improvements for the project:

- Improve model accuracy.
- Add more recycling categories.
- Expand the multi-city recycling dataset.
- Add user history.
- Add better error handling.
- Add loading states and clearer UI feedback.
- Add deployment support.
- Connect the frontend and backend to a production-ready API URL.
- Improve mobile responsiveness.
- Add authentication if needed.

---

## Authors

Developed as part of the GreenBin recycling assistant project.

Main repository:

```txt
https://github.com/JohnZach31/GreenBin
```

---

## License

This project is currently for educational and demonstration purposes.
