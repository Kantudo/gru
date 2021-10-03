import torch

from torch import nn
import numpy as np
import torch.nn.functional as F


class NeuralNetwork(nn.Module):
    def __init__(self, n_neurons_per_layer, n_layers):
        super(NeuralNetwork, self).__init__()
        self.flatten = nn.Flatten()

        inner_layers = []
        for _ in range(n_layers):
            inner_layers.append(
                nn.Linear(n_neurons_per_layer, n_neurons_per_layer)
            )
            inner_layers.append(
                nn.ReLU()
            )
        self.linear_relu_stack = nn.Sequential(
            nn.Linear(28*28, n_neurons_per_layer),
            nn.ReLU(),
            *inner_layers,
            nn.Linear(n_neurons_per_layer, 10),
            nn.ReLU()
        )
    def forward(self, x):
        x = self.flatten(x)
        logits = self.linear_relu_stack(x)
        return logits

device = "cpu"

n_neurons_per_layer = 256
n_layers = 3

trained_model_file = "./model"

model = NeuralNetwork(n_neurons_per_layer, n_layers).to(device)
model.load_state_dict(torch.load(trained_model_file, map_location=device))

def normalize_2dmatrix(matrix):
    max_val = max([max(row) for row in matrix])

    for i, row in enumerate(matrix):
        for j, val in enumerate(row):
            try:
                matrix[i][j] = val/max_val
            except:
                matrix[i][j] = val

def infer(number_matrix) -> int:
    normalize_2dmatrix(number_matrix)
    a = torch.from_numpy(np.array([number_matrix])).float()
    b = list(model(a)[0])
    m = max(b)
    return b.index(m)