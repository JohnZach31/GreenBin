# GreenBin

GreenBin is a waste classification web application.

The user uploads an image of a waste item, the system classifies the item using the yangy50/garbage-classification model from Huggingface, and then recommends the correct recycling bin or nearby recycling point using the API straight from Tel Aviv or Rishon Leziyon's registry.

## Official Used Links
Repo: https://github.com/JohnZach31/GreenBin/tree/main
Model: https://huggingface.co/yangy50/garbage-classification

## How to use?
1. Open the application and upload an image file (PNG or JPEG).
2. The model processes your photo. It should detect what your waste item is made of. (Notice you can only upload 1 item at any time).
3. Continuing allows you to choose a viable close destination of your nearest recycling bin in your area. Enter an adress and recieve more info.

## Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- ML: yangy50/garbage-classification model from Huggingface
- Data: Local JSON file for recycling points

## Project Structure

```txt
greenbin/
├── frontend/
├── backend/
├── ml/
└── docs/