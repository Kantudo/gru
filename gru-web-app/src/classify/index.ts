import * as tf from '@tensorflow/tfjs'

// console.log('tf')
// console.log(tf)

async function inferr(): Promise<tf.LayersModel> {

    let modelName = 'MLP_3hl_128nphl'

    modelName += '/model.json'

    if(modelName.includes('MLP')) {
        modelName = 'mlp/' + modelName
    }

    const model = await tf.loadLayersModel(
                    window.location.protocol + '//' +
                    window.location.hostname +
                    (window.location.port ? ':' + window.location.port : '') +
                    window.location.hostname.includes('github') ? '/gru/' : '/' +
                    'models/' +
                    modelName);

    return model
}

export default inferr