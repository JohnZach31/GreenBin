from pathlib import Path
import shutil
import random

BASE_DIR = Path(__file__).resolve().parents[1]

RAW_ROOT = BASE_DIR / "data" / "raw" / "Garbage_Dataset_Classification" / "images"
CLEAN_ROOT = BASE_DIR / "data" / "cleaned"

CLASS_NAMES = [
    "cardboard",
    "glass",
    "metal",
    "paper",
    "plastic",
    "trash",
]

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".jfif", ".webp"}


def clear_folder(path: Path):
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def get_images(folder: Path):
    if not folder.exists():
        raise FileNotFoundError(f"Folder not found: {folder}")

    return [
        file
        for file in folder.rglob("*")
        if file.is_file() and file.suffix.lower() in IMAGE_EXTENSIONS
    ]


def split_files(files, train_ratio=0.7, val_ratio=0.15):
    files = list(files)
    random.shuffle(files)

    total = len(files)

    train_end = int(total * train_ratio)
    val_end = train_end + int(total * val_ratio)

    train_files = files[:train_end]
    val_files = files[train_end:val_end]
    test_files = files[val_end:]

    return train_files, val_files, test_files


def copy_images(files, destination: Path):
    destination.mkdir(parents=True, exist_ok=True)

    for file_path in files:
        shutil.copy2(file_path, destination / file_path.name)


def main():
    random.seed(42)

    print("Cleaning multi-class waste dataset...")
    print(f"Raw root: {RAW_ROOT}")
    print(f"Clean root: {CLEAN_ROOT}")

    clear_folder(CLEAN_ROOT)

    for class_name in CLASS_NAMES:
        raw_class_folder = RAW_ROOT / class_name

        images = get_images(raw_class_folder)

        train_files, val_files, test_files = split_files(
            images,
            train_ratio=0.7,
            val_ratio=0.15
        )

        copy_images(train_files, CLEAN_ROOT / "train" / class_name)
        copy_images(val_files, CLEAN_ROOT / "val" / class_name)
        copy_images(test_files, CLEAN_ROOT / "test" / class_name)

        print(f"{class_name}:")
        print(f"  train: {len(train_files)}")
        print(f"  val:   {len(val_files)}")
        print(f"  test:  {len(test_files)}")

    print("\nCleaned dataset created successfully.")
    print(CLEAN_ROOT)


if __name__ == "__main__":
    main()