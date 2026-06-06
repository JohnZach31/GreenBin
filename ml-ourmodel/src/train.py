import os

#ResNet Libraries
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from model import build_resnet_model

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(BASE_DIR, "data", "cleaned")
TRAIN_PATH = os.path.join(DATASET_PATH, "train")
VAL_PATH = os.path.join(DATASET_PATH, "val")

#model settings for train
MODEL_SAVE_PATH = os.path.join(BASE_DIR, "saved_model", "greenbin_resnet.pth")

BATCH_SIZE = 32 #batch size for train
EPOCHS = 5 #epochs
LEARNING_RATE = 0.001 #Adjustable alpha

#helper func 1
def get_transforms():
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)), #image transform
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    return train_transform, val_transform

#another helper func
def load_data():
    if not os.path.exists(TRAIN_PATH):
        raise FileNotFoundError(f"Training folder does not exist. {TRAIN_PATH}")

    if not os.path.exists(VAL_PATH):
        raise FileNotFoundError(f"Validation Folder does not exist. {VAL_PATH}")

    train_transform, val_transform = get_transforms()

    train_dataset = datasets.ImageFolder(
        root=TRAIN_PATH,
        transform=train_transform
    )

    val_dataset = datasets.ImageFolder(
        root=VAL_PATH,
        transform=val_transform
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=BATCH_SIZE,
        shuffle=True
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=BATCH_SIZE,
        shuffle=False
    )

    return train_dataset, val_dataset, train_loader, val_loader

def train_one_epoch(model, train_loader, criterion, optimizer, device):
    model.train()

    #more finetuning tools here
    running_loss = 0.0
    correct_predictions = 0
    total_predictions = 0

    for images, labels in train_loader:
        images = images.to(device)
        labels = labels.to(device)

        optimizer.zero_grad() #zerograd optimizer

        outputs = model(images)
        loss = criterion(outputs, labels)

        loss.backward() #backward step
        optimizer.step()

        running_loss += loss.item()

        _, predicted = torch.max(outputs, 1)
        total_predictions += labels.size(0)
        correct_predictions += (predicted == labels).sum().item()

    average_loss = running_loss / len(train_loader)
    accuracy = 100 * correct_predictions / total_predictions

    return average_loss, accuracy

#helper func for validation
def evaluate(model, val_loader, criterion, device):
    model.eval()

    running_loss = 0.0
    correct_predictions = 0
    total_predictions = 0

    with torch.no_grad():
        for images, labels in val_loader:
            images = images.to(device)
            labels = labels.to(device)

            outputs = model(images)
            loss = criterion(outputs, labels)

            running_loss += loss.item()

            _, predicted = torch.max(outputs, 1)
            total_predictions += labels.size(0)
            correct_predictions += (predicted == labels).sum().item()

    average_loss = running_loss / len(val_loader)
    accuracy = 100 * correct_predictions / total_predictions

    return average_loss, accuracy

def main():
    print("TRAIN SCRIPT STARTED")

    os.makedirs(os.path.dirname(MODEL_SAVE_PATH), exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    train_dataset, val_dataset, train_loader, val_loader = load_data()

    class_names = train_dataset.classes
    num_classes = len(class_names)

    print(f"Classes: {class_names}")
    print(f"Classes number: {num_classes}")
    print(f"Training Images: {len(train_dataset)}")
    print(f"Validation Images: {len(val_dataset)}")

    model = build_resnet_model(num_classes)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()

    #Training the final layer, ResNet base is frozen
    #Adam Optimizer
    optimizer = optim.Adam(model.fc.parameters(), lr=LEARNING_RATE)

    best_val_accuracy = 0.0

    for epoch in range(EPOCHS):
        print(f"\nEpoch {epoch + 1}/{EPOCHS}")

        train_loss, train_accuracy = train_one_epoch(
            model=model,
            train_loader=train_loader,
            criterion=criterion,
            optimizer=optimizer,
            device=device
        )

        val_loss, val_accuracy = evaluate(
            model=model,
            val_loader=val_loader,
            criterion=criterion,
            device=device
        )

        #Metricot
        print(f"Train Loss: {train_loss:.6f}")
        print(f"Train Accuracy: {train_accuracy:.4f}%")
        print(f"Val Loss: {val_loss:.6f}")
        print(f"Val Accuracy: {val_accuracy:.3f}%")

        if val_accuracy > best_val_accuracy:
            best_val_accuracy = val_accuracy

            torch.save({
                "model_state_dict": model.state_dict(),
                "class_names": class_names,
                "val_accuracy": val_accuracy
            }, MODEL_SAVE_PATH)

            print(f"Best Model Saved with val acc: {val_accuracy:.3f}%")

    print("\nTraining finished.")
    print(f"Best validation accuracy: {best_val_accuracy:.2f}%")
    print(f"Model saved to: {MODEL_SAVE_PATH}")


if __name__ == "__main__":
    main()