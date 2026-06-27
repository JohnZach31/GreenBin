# ♻️ GreenBin

GreenBin is a simple recycling assistant that helps you figure out what to do with waste items.

You can upload a photo, take a picture, search manually, and build a small recycling plan from multiple items.

No complicated setup. No terminal wizardry. Just open the app and start using it.

---

## 🚀 How to Open the App

The easiest way to run GreenBin is by using:

```txt
start.bat
```

### Steps

1. Open the `GreenBin` folder.
2. Double-click:

```txt
start.bat
```

3. Wait a few seconds.
4. The app should open automatically in your browser.

The app usually opens here:

```txt
http://localhost:5173
```

That is the main GreenBin app page.

---

## 📱 Opening GreenBin on Your Phone

You can also use GreenBin from your phone.

When you run `start.bat`, it will show a phone link that looks something like this:

```txt
http://192.168.1.47:5173
```

Open that link on your phone browser.

### Important

Your phone and computer must be connected to the same Wi-Fi network.

If Windows asks whether to allow access for Node.js or the app, click:

```txt
Allow
```

Otherwise your phone might not be able to connect.

---

## 🧠 What GreenBin Does

GreenBin helps you recycle smarter.

You can:

- 📸 Upload a photo of an item
- 🎥 Use the camera flow
- 🔍 Search manually for an item
- ♻️ Check recycling information
- 🧺 Add multiple items to a recycling queue
- 🗂️ Build a recycling plan from several photos

The app is meant to make recycling decisions easier, especially when you are not sure where something belongs.

---

## 🖥️ Main App Sections

### 📤 Upload

Upload a photo of an item you want to recycle.

Example items:

- Plastic bottle
- Cardboard box
- Paper cup
- Can
- Food packaging
- Glass bottle

---

### 🧪 Analyze

After uploading an image, GreenBin analyzes the item and shows recycling-related information.

This can help you understand:

- What the item probably is
- Whether it may be recyclable
- What kind of bin or recycling action may be relevant

---

### 🧺 Recycling Queue

The recycling queue lets you collect multiple items before making a plan.

This is useful if you have several things to throw away and want to handle them together.

Example:

```txt
1. Plastic bottle
2. Cardboard box
3. Metal can
4. Glass jar
```

Instead of checking one item and forgetting it, you can build a small recycling list.

---

### 🔎 Manual Search

If you do not want to upload a photo, you can search for an item manually.

Example searches:

```txt
pizza box
plastic bag
coffee cup
glass bottle
battery
```

This is useful when the camera or image upload is not needed.

---

### 📷 Camera

The camera flow lets you take a photo directly instead of uploading an existing image.

This is especially useful on a phone.

---

## ✅ Recommended Demo Flow

If you are recording a video or presenting the project, use this flow:

1. Open the app using `start.bat`.
2. Show the homepage.
3. Upload a photo of a recyclable item.
4. Click the analyze button.
5. Show the result.
6. Add the item to the recycling queue.
7. Add another item.
8. Show the queue.
9. Use manual search for one item.
10. Open the app on your phone using the phone link.

Nice, clean, understandable. No need to overcook it like a cursed student-project lasagna.

---

## 🛠️ First-Time Setup

Before using `start.bat`, make sure the app was installed once.

Use:

```txt
install.bat
```

### When should you use `install.bat`?

Use it when:

- You downloaded the project for the first time
- You pulled new changes from GitHub
- The app does not start properly
- Dependencies changed

You do not need to run `install.bat` every time.

Normal use:

```txt
start.bat
```

Only when needed:

```txt
install.bat
```

---

## 🧩 Files You Actually Need

For normal use, the most important files are:

```txt
start.bat
install.bat
```

### `start.bat`

Starts the app.

Use this every time you want to open GreenBin.

### `install.bat`

Installs the required project packages.

Use this only when setting up the app for the first time or after major updates.

---

## 📦 Project Folder

The project has a few main folders:

```txt
GreenBin/
│
├── backend/
├── frontend/
├── ml-huggingface/
├── ml-ourmodel/
├── docs/
├── start.bat
├── install.bat
└── README.md
```

### What each folder means

| Folder | What it does |
|---|---|
| `frontend/` | The visual app you use in the browser |
| `backend/` | The server that handles app requests |
| `ml-huggingface/` | Machine learning experiment/model folder |
| `ml-ourmodel/` | Custom machine learning model folder |
| `docs/` | Extra documentation or project notes |

Most users do not need to touch these folders.

Just use:

```txt
start.bat
```

---

## 🧯 Troubleshooting

### The app does not open

Try running:

```txt
start.bat
```

again.

If it still does not work, run:

```txt
install.bat
```

Then run:

```txt
start.bat
```

---

### The phone link does not work

Check these:

- Your phone and computer are on the same Wi-Fi.
- You copied the full phone link correctly.
- Windows Firewall allowed access.
- The app is still running on your computer.

The phone link should look like this:

```txt
http://192.168.x.x:5173
```

Do not use `localhost` on your phone.

`localhost` only works on the computer running the app.

---

### The browser says the site cannot be reached

Wait a few more seconds.

The app may still be starting.

Then refresh the browser.

---

### The app opens but something does not analyze correctly

Try:

1. Refresh the page.
2. Upload a clearer photo.
3. Use manual search instead.
4. Restart the app with `start.bat`.

---

### A black terminal window opened. Is that okay?

Yes.

GreenBin needs terminal windows running in the background.

Do not close them while using the app.

If you close them, the app may stop working.

---

## 🛑 How to Close the App

To stop GreenBin:

1. Close the browser tab.
2. Close the backend terminal window.
3. Close the frontend terminal window.

That fully shuts down the app.

---

## 💡 Tips for Best Results

For better image results:

- Use good lighting.
- Put the item clearly in the frame.
- Avoid blurry photos.
- Try to photograph one item at a time.
- Use manual search if the item is hard to recognize.

Good photo:

```txt
One clear plastic bottle on a table
```

Less good photo:

```txt
A dark blurry photo of ten random things in a bag
```

The app is smart, not psychic. Sadly.

---

## 🧪 Example Items to Try

Good items for testing:

- Plastic bottle
- Soda can
- Cardboard box
- Glass jar
- Paper bag
- Newspaper
- Food container
- Shampoo bottle
- Milk carton
- Pizza box

---

## 🎬 Video Demo Checklist

Before recording a demo video:

- Run `start.bat`
- Make sure the app opens
- Test one image upload
- Test one manual search
- Test the recycling queue
- Open the phone link if you want to show mobile support
- Keep the terminal windows open

A simple demo is better than a chaotic one.

Show the app clearly, explain what the user does, and keep the flow practical.

---

## 🌱 About GreenBin

GreenBin was created to make recycling easier and more approachable.

Many people want to recycle but are not always sure what goes where.

GreenBin tries to reduce that confusion by giving users a fast way to check items, search manually, and organize recyclable waste into a simple queue.

---

## 📌 Quick Start Summary

Use this when you just want the shortest possible version:

```txt
1. Open the GreenBin folder
2. Double-click start.bat
3. Wait for the browser to open
4. Use the app
```

For phone:

```txt
1. Run start.bat
2. Copy the phone link
3. Open it on your phone
4. Make sure both devices are on the same Wi-Fi
```

That is it.
