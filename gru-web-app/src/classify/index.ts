import * as tf from '@tensorflow/tfjs'
// import * as d3 from "d3";

interface ConvolutionalParameters {
    ncl: number, // Number of convolutional layers
    filters: number, // Number of filers
    pool: number, // Poolsize (maxpooling)
    nhl: number, // Hidden layers
    nphl: number, // Neurons per hidden layer
}

interface MlpParameters {
    hl: number, // Hidden layers
    nphl: number, // Neurons per hidden layer
}

interface Net {
    type: "mlp" | "cnn",
    quantized: boolean,
    noisy: boolean,
    parameters: ConvolutionalParameters | MlpParameters
}

let cachedModels = {}
// console.log('tf')
// console.log(tf)

async function inferr(model?: Net): Promise<tf.LayersModel> {
    let modelName
    if (!model) {
        modelName = 'MLP_3hl_128nphl'

        modelName += '/model.json'

        modelName = 'mlp/' + modelName
    } else {
        modelName = ""
        modelName += model.type + "/"
        if (model.quantized && model.noisy) {
            modelName += "quantized_noisy/"
        } else if (model.quantized) {
            modelName += "quantized/"
        }
        modelName += model.type.toUpperCase() + "_" +
                        Object.entries(model.parameters).map(([key, entry]) => entry+key).join("_")
        modelName += '/model.json'
    }

    

    let loadedModel

    if(modelName in cachedModels){
        loadedModel = (cachedModels as any)[modelName]
    } else {
        loadedModel = await tf.loadLayersModel(
            window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + window.location.pathname + 'models/' + modelName);
        (cachedModels as any)[modelName] = loadedModel
    }

    // console.log(flattenedWeights)
    // d3.bin
    // var bins = d3.bin().domain([-1, 1])
    // console.log(bins(flattenedWeights))

    return loadedModel
}

// export default inferr
export type {Net}
export {inferr}