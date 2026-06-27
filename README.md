# ♻️ GreenBin

GreenBin is a recycling assistant web app.

Use it to upload or capture a photo of an item, check recycling information, search manually, and build a recycling queue from multiple items.

---

## 🚀 Quick Start

### 1. Install once

Before running the app for the first time, double-click:

```txt
install.bat
```

This installs everything the app needs.

You only need to run this again if:

- You downloaded the project for the first time
- You pulled major updates from GitHub
- The app does not start correctly

---

### 2. Open the app

After installation, double-click:

```txt
start.bat
```

This starts GreenBin and opens it in your browser.

The app usually opens here:

```txt
http://localhost:5173
```

Keep the terminal windows open while using the app.

---

## 📱 Use GreenBin on Your Phone

When you run `start.bat`, it also prints a phone link.

It will look something like this:

```txt
http://192.168.1.47:5173
```

Open that link on your phone.

### Important

Your phone and computer must be connected to the same Wi-Fi network.

If Windows asks for permission, allow access.

Do not use this on your phone:

```txt
http://localhost:5173
```

`localhost` only works on the computer running the app.

---

## 🧠 What You Can Do in GreenBin

GreenBin lets you:

- 📸 Upload an image of an item
- 📷 Take a photo using the camera flow
- 🔍 Search for an item manually
- ♻️ Get recycling guidance
- 🧺 Add items to a recycling queue
- 🗂️ Build a recycling plan from multiple items

---

## 🧺 Recycling Queue

The recycling queue lets you collect several items before deciding what to do with them.

For example, you can add:

```txt
Plastic bottle
Cardboard box
Metal can
Glass jar
```

Then GreenBin helps organize the items into a clearer recycling plan.

---

## 🔎 Manual Search

You do not have to upload a photo.

You can search manually for items like:

```txt
plastic bottle
pizza box
glass jar
battery
paper bag
food container
```

This is useful when you already know the item name or when the image is unclear.

---

## 🖼️ Tips for Better Image Results

For better results:

- Use a clear photo
- Use good lighting
- Try one item at a time
- Avoid blurry images
- Keep the item centered in the picture

If the image result is not good, try manual search.

---

## 🛑 How to Close GreenBin

To stop the app:

1. Close the browser tab.
2. Close the backend terminal window.
3. Close the frontend terminal window.

Once the terminal windows are closed, the app is no longer running.

---

## 🧯 Troubleshooting

### The app does not open

Try this:

1. Run `install.bat`
2. Run `start.bat` again

---

### The phone link does not work

Check that:

- Your phone and computer are on the same Wi-Fi
- You copied the full phone link
- Windows Firewall allowed access
- The app is still running on your computer

The phone link should look like:

```txt
http://192.168.x.x:5173
```

---

### The page opens but nothing loads

Wait a few seconds and refresh the page.

If it still does not work, close the terminal windows and run:

```txt
start.bat
```

again.

---

### Image analysis does not work well

Try:

- A clearer image
- Better lighting
- One item at a time
- Manual search instead

---

## 📌 Simple Version

For normal use:

```txt
Double-click start.bat
```

For first-time setup:

```txt
Double-click install.bat
```

That is it.
