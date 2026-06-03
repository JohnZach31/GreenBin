from transformers import pipeline
import json
import sys
import os
# Imports

MODEL_NAME = "yangy50/garbage-classification"

#this is the mapping for the recycling instructions.
ISRAEL_RECYCLING_MAP = {
    "cardboard": {
        "displayname": "Carton",
        "category": "cardboard",
        "binRec": "יש להשליך לפח הקרטוניה או נקודת איסוף קרטון קרובה"
    },
    "glass": {
        "displayname": "Glass",
        "category": "glass",
        "binRec": "יש להשליך לפח הסגול או נקודת מחזור זכוכית קרובה"
    },
    "metal": {
        "displayname": "Metal",
        "category": "metal",
        "binRec": "אם מדובר באריזת מתכת - לרוב יש להשליכה לפח הכתום. אחרת אנא בדקו את תווית היצור או אתר הגריטה הקרוב אליכם"
    },
    "paper": {
        "displayname": "Paper",
        "category": "paper",
        "binRec": "יש להשליך לפח הכחול או נקודת איסוף נייר קרובה"
    },
    "plastic": {
        "displayname": "Plastic",
        "category": "plastic",
        "binRec": "יש להשליך לפח הכתום או נקודת איסוף פלסטיק קרובה"
    },
    "trash": {
        "displayname": "General Waste",
        "category": "trash",
        "binRec": "יש להשליך לפח ירוק (גם נקרא צפרדע) או כל פח רגיל אחר בסביבתכם"
    }
}

#model loader helper func
def load_model():
    """ Loads the HUGGINGFACE model. This model will be downloaded automatically on the first run, so please dont worry :)"""   
    return pipeline(
        task = "image-classification",
        model = MODEL_NAME
    )

def classify_image(image_path):
    """ Classifies the image at the given path and returns the category and recycling instructions. """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at path: {image_path}")
    
    classifier = load_model()
    predictions = classifier(image_path)

    if not predictions:
        raise ValueError("No predictions returned by the model.")
    
    best = predictions[0]
    raw_label = best['label'].lower()
    confidence = float(best['score'])

    recycling_info = ISRAEL_RECYCLING_MAP.get(raw_label, {
        "displayname": raw_label.capitalize(),
        "category": raw_label,
        "binRec": "לא נמצאה המלצת מחזור מדויקת עבור פריט זה כרגע..."
    })

    result = {
        "label": raw_label,
        "displayname": recycling_info["displayname"],
        "category": recycling_info["category"],
        "confidence": confidence,
        "binRec": recycling_info["binRec"],
        "topPredictions": [
            {
                "label": pred['label'].lower(),
                "confidence": float(pred['score'])
            }
            for pred in predictions[:5]
        ]
    }

    return result

def main():
    if len(sys.argv) < 2:
        error_result = {
            "error": "Missing image path. Usage: python classify.py <image_path>"
        }
        print(json.dumps(error_result))
        return 0

    image_path = sys.argv[1]
    try:
        result = classify_image(image_path)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        error_result = {
            "error": str(e)
        }
        print(json.dumps(error_result, ensure_ascii=False))

if __name__ == "__main__":
    main()
