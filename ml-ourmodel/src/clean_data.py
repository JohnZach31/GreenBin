from pathlib import Path
import shutil
import random

RAW_ROOT = Path("ml-ourmodel/data/raw/DATASET/DATASET")
CLEAN_ROOT = Path("ml-ourmodel/data/cleaned")

CLASS_MAP = {
    "O": "organic",
    "R": "recyclable",
}

# allow all common image formats
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".jfif"}


def clear_folder(path: Path):
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def copy_images(files, destination: Path):
    destination.mkdir(parents=True, exist_ok=True)

    for file_path in files:
        shutil.copy2(file_path, destination / file_path.name)


def split_train_val(files, val_ratio=0.15):
    files = list(files)
    random.shuffle(files)

    val_size = int(len(files) * val_ratio)

    val_files = files[:val_size]
    train_files = files[val_size:]

    return train_files, val_files


def get_images(folder: Path):
    return [
        file
        for file in folder.rglob("*")
        if file.is_file() and file.suffix.lower() in IMAGE_EXTENSIONS
    ]


def main():
    random.seed(42)

    print("From Raw to Clean.")
    clear_folder(CLEAN_ROOT)

    for old_class, new_class in CLASS_MAP.items():
        raw_train_folder = RAW_ROOT / "TRAIN" / old_class
        raw_test_folder = RAW_ROOT / "TEST" / old_class

        train_images = get_images(raw_train_folder)
        test_images = get_images(raw_test_folder)

        train_files, val_files = split_train_val(train_images, val_ratio=0.15)

        copy_images(train_files, CLEAN_ROOT / "train" / new_class)
        copy_images(val_files, CLEAN_ROOT / "val" / new_class)
        copy_images(test_images, CLEAN_ROOT / "test" / new_class)

        print(f"{new_class}:")
        print(f"  train: {len(train_files)}")
        print(f"  val:   {len(val_files)}")
        print(f"  test:  {len(test_images)}")

    print("Clean:")
    print(CLEAN_ROOT)


if __name__ == "__main__":
    main()