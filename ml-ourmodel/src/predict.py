import os
import sys
import json

#ResNet Libraries
import torch
from PIL import Image
from torchvision import transforms
from model import build_resnet_model

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

#model settings prediction values
MODEL_PATH = os.path.join(BASE_DIR, "saved_model", "greenbin_resnet.pth")

#helper func image transformation
def get_prediction_transformation():
    prediction_transform = transforms.Compose([
        transforms.Resize((224, 224)), #Image Transformation 224
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    return prediction_transform

#helper function for loading model
def load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model File does not exist. {MODEL_PATH}")
    
    #cpu or gpu depends on the system
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    checkpoint = torch.load(MODEL_PATH, map_location=device)
    class_names = checkpoint["class_names"]

    model = build_resnet_model(len(class_names))
    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.to(device)
    model.eval()

    return model, class_names, device

#main predict func
def predict_image(image_path):
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image file does not exist. {image_path}")
    
    model, class_names, device = load_model()
    prediction_transform = get_prediction_transformation()

    image = Image.open(image_path).convert("RGB")
    image = prediction_transform(image)
    image = image.unsqueeze(0)
    image = image.to(device)

    with torch.no_grad():
        outputs = model(image)
        prob = torch.softmax(outputs, dim=1)

        confidence, predicted_index = torch.max(prob, 1)

    predicted_class = class_names[predicted_index.item()]
    confidence_percent = confidence.item() * 100

    result = {
        "predicted_class_is": predicted_class,
        "confidence": round(confidence_percent, 2)
    }

    return result

def main():
    if len(sys.argv) < 2:
        print("Use with Bash: python src/predict.py path/to/image.jpg")
        return
    
    image_path = sys.argv[1]

    try: 
        result = predict_image(image_path)
        print(json.dumps(result, indent=4))
    except Exception as error:
        print(json.dumps({
            "error": str(error)
        }, indent=4))


if __name__ == "__main__":
    main()