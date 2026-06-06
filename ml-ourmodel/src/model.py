import torch.nn as nn
from torchvision import models


def build_resnet_model(num_classes: int):
    """
    Builds a pretrained ResNet18 model for GreenBin waste classification.
    """

    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

    # Freeze pretrained layers
    for param in model.parameters():
        param.requires_grad = False

    # Replace final layer for our dataset classes
    input_features = model.fc.in_features
    model.fc = nn.Linear(input_features, num_classes)

    return model